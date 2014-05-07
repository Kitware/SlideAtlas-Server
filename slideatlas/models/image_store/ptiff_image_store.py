# coding=utf-8

import datetime
import glob
import logging
import os
import StringIO

from mongoengine import DateTimeField, StringField, DoesNotExist, \
    MultipleObjectsReturned

from .image_store import MultipleDatabaseImageStore
from ..image import Image
from ..view import View
from ..session import Session, RefItem

from slideatlas.ptiffstore.reader_cache import make_reader
from slideatlas.ptiffstore.common_utils import get_max_depth, getcoords


################################################################################
__all__ = ('PtiffImageStore', 'PtiffTileStore')
logger = logging.getLogger('slideatlas.ptiffstore')


################################################################################
class PtiffImageStore(MultipleDatabaseImageStore):
    """
    The data model for PtiffStore

    Equivalent to images collections
    Should encapsulate entire assetstore, and this being tile specific version of it.

    This generalizes "databases" collection which should ultimately point to asses collection
    with each asset object will have a type = MongoAssetStore if not specified

    All sessions are stored in admindb in ptiffsessions and images are stored in ptiffimages
    expects the model to have
    """
    meta = {
    }

    last_sync = DateTimeField(required=True, default=datetime.datetime.min) #: Timestamp used to quickly new files

    root_path = StringField(required=True) #: Path of the folder where the incoming images arrive

    @property
    def session_name(self):
        return 'All'


    def get_tile(self, image_id, tile_name):
        """
        Function redefinition to get_tile
        Raises exceptions that must be caught by the calling routine
        """
        with self:
            image = Image.objects.get_or_404(id=image_id)

        tile_size = image.tile_size
        tiff_path = os.path.join(self.root_path, image.filename)

        index_x, index_y, index_z = getcoords(tile_name[:-4])

        reader = make_reader({
            'fname': tiff_path,
            'dir': image.levels - index_z -1,
        })
        logging.info('Viewing fname: %s' % tiff_path)

        # Locate the tile name from x and y
        pixel_x = index_x * tile_size + 5
        pixel_y = index_y * tile_size + 5

        tile_buffer = StringIO.StringIO()
        reader_result = reader.dump_tile(pixel_x, pixel_y, tile_buffer)

        if reader_result > 0:
            logging.info('Read %d bytes' % reader_result)
        else:
            raise Exception('Tile not read')

        return tile_buffer.getvalue()

    # def load_folder(self):
    #     # TODO: 'path_to_watch' is not defined
    #     self.before = dict ((f, None) for f in os.listdir (path_to_watch))
    #
    # def _remove_image(self, id):
    #     pass
    #
    # def _add_image(self, filename):
    #     pass

    def sync(self, resync=False):
        """
        Syncs the objects in Image Session and View with the files in given folder.

        Resynchronization

        - Verifies that all images referred in image collection are available in the file store.
        - Delete any images that are missing along with any views and session entries that depend on it.
        - Finds out new files are not yet added to the store
        - Creates a view for these in 'self.session_name' session
        - Include the images that are newly added (based on filename / modification date)

        It is assumed that the modification dates to any changes to folder are intact

        A special session All contains 1 view corresponding to each of the image files

        """
        with self:
            # Find the session
            try:
                session = Session.objects.get(name=self.session_name)
            except DoesNotExist:
                session = Session(name=self.session_name, label=self.session_name)
            except MultipleObjectsReturned:
                # TODO: this generally shouldn't happen, but should be handled
                raise

            updated_images = []

            search_path = os.path.join(self.root_path, '*.ptif')
            for total_image_count, image_file_path in enumerate(glob.glob(search_path)):

                m_time = datetime.datetime.fromtimestamp(os.path.getmtime(image_file_path))
                if self.last_sync < m_time :
                    logging.warning('Needs refresh: %s' % image_file_path)

                    image_file_name = os.path.basename(image_file_path)
                    reader = make_reader({
                        'fname': image_file_path,
                        'dir': 0,
                    })
                    reader.set_input_params({
                        'fname': image_file_path,
                    })
                    reader.parse_image_description()
                    logging.info(reader.barcode)

                    image_created = False
                    # Locate the record
                    try:
                        image = Image.objects.get(filename=image_file_name)
                    except DoesNotExist:
                        # Needs to sync
                        logging.info('Reading file: %s' % image_file_name)
                        image = Image(filename=image_file_name)
                        image_created = True
                    except MultipleObjectsReturned:
                        # TODO: this generally shouldn't happen, but should be handled
                        raise

                    image.label = '%s (%s)' % (reader.barcode['str'], image_file_name)
                    image.dimensions = [reader.width, reader.height, 1]
                    image.levels = get_max_depth(reader.width, reader.height, reader.tile_width)
                    image.tile_size = reader.tile_width
                    image.coordinate_system = 'Pixel'
                    image.bounds = [0, reader.width-1, 0, reader.height-1, 0, 0]

                    image.save()

                    if image_created or resync:
                        # find all existing views for the image and delete them
                        for view in View.objects(image=image.id):
                            session.views.remove(view.id)
                            view.delete()

                        # create a new view
                        view = View(image=image.id)
                        view.save()
                        session.views.append(RefItem(ref=view.id))

                    updated_images.append(image.to_mongo())
                else:
                    logging.info('Is good: %s' % image_file_path)

            session.save()

            resp = {
                'count': total_image_count,
                'synced': len(updated_images),
                'images': updated_images,
            }
            self.last_sync = datetime.datetime.now()
            self.save()
            return resp


    def resync(self):
        """
        Delete and recreate all Images, Views, and Sessions.
        """
        self.last_sync = datetime.datetime.min
        self.save()

        with self:
            View.drop_collection()
            Image.drop_collection()

            Session.objects(name=self.session_name).delete()

        # Wipes all the images
        return self.sync(resync=True)


################################################################################
# TODO: 'Database' is deprecated, but still in lots of existing code
PtiffTileStore = PtiffImageStore
