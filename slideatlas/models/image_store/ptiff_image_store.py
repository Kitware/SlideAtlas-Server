# coding=utf-8

import base64
import datetime
import glob
import logging
import os
try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

from mongoengine import DateTimeField, StringField, DoesNotExist, \
    MultipleObjectsReturned
from PIL import Image as PImage

from .image_store import MultipleDatabaseImageStore
from ..image import Image
from ..view import View
from ..session import Session, RefItem

from slideatlas.ptiffstore.reader_cache import make_reader
from slideatlas.ptiffstore.common_utils import get_max_depth, getcoords

################################################################################
__all__ = ('PtiffImageStore',)
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

    last_sync = DateTimeField(required=True, default=datetime.datetime.min,
        verbose_name='Last Sync', help_text='Timestamp of the last check for new images.')

    root_path = StringField(required=True,
        verbose_name='Root Path', help_text='Location on local filesystem for image files.')

    @property
    def session_name(self):
        return 'All'


    def get_tile(self, image_id, tile_name):
        """
        Returns an image tile as a binary JPEG string.

        :raises: DoesNotExist
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
        logging.info('Getting tile from: %s' % tiff_path)

        # Locate the tile name from x and y
        pixel_x = index_x * tile_size + 5
        pixel_y = index_y * tile_size + 5

        tile_buffer = StringIO.StringIO()
        reader_result = reader.dump_tile(pixel_x, pixel_y, tile_buffer)

        if reader_result > 0:
            logging.info('Read %d bytes' % reader_result)
        else:
            raise DoesNotExist('Tile not able to be read from %s' % tiff_path)

        return tile_buffer.getvalue()

    def get_thumb(self, image):
        """
        Returns a thumbnail with a label as a binary JPEG string.
        """
        tiff_path = os.path.join(self.root_path, image.filename)

        reader = make_reader({
            'fname': tiff_path,
            'dir': 0,
        })

        # TODO: create a separate call for parsing embedded images
        reader.parse_image_description()

        logging.info('Getting thumbnail from: %s' % tiff_path)

        # Load the stored images
        label_image = PImage.open(StringIO.StringIO(base64.b64decode(reader.get_embedded_image('label'))))
        macro_image = PImage.open(StringIO.StringIO(base64.b64decode(reader.get_embedded_image('macro'))))

        # Resize both files for
        macro_width, macro_height = macro_image.size
        macro_image.thumbnail((macro_width * 100.0 / macro_height, 100))
        macro_width, macro_height = macro_image.size

        # Rotate label image
        rotation = label_image.rotate(90).resize((100, 100))

        # Pasting
        new_image = PImage.new('RGB', (macro_width + 100, 100))
        new_image.paste(rotation, (0, 0, 100, 100))
        new_image.paste(macro_image, (100, 0, macro_width + 100, 100))

        # Output
        tile_buffer = StringIO.StringIO()
        new_image.save(tile_buffer, format='JPEG')
        contents = tile_buffer.getvalue()
        tile_buffer.close()

        return contents


    # def load_folder(self):
    #     # TODO: 'path_to_watch' is not defined
    #     self.before = dict ((f, None) for f in os.listdir (path_to_watch))
    #
    # def _remove_image(self, id):
    #     pass
    #
    # def _add_image(self, filename):
    #     pass

    def sync(self):
        """
        Syncs the objects in Image Session and View with the files in given folder.

        - Verifies that all images referred in image collection are available in the file store.
        - Finds out new files are not yet added to the store
        - Creates a view for these in 'self.session_name' session
        - Include the images that are newly added (based on filename / modification date)

        It is assumed that the modification dates to any changes to folder are intact

        A special session, 'self.session_name', contains 1 view corresponding to each of the image files

        """
        with self:
            # Find the session
            try:
                session = Session.objects.get(image_store=self, name=self.session_name)
            except DoesNotExist:
                session = Session(image_store=self, name=self.session_name, label=self.session_name)
            except MultipleObjectsReturned:
                # TODO: this generally shouldn't happen, but should be handled
                raise

            updated_images = list()
            new_views = list()

            search_path = os.path.join(self.root_path, '*.ptif')
            # sorting will be by modification time, with earliest first
            ptiff_files = sorted(
                (datetime.datetime.fromtimestamp(os.path.getmtime(image_file_path)), image_file_path)
                for image_file_path in glob.glob(search_path))

            for file_modified_time, image_file_path in ptiff_files:
                image_file_name = os.path.basename(image_file_path)

                # always try to find images in database, even if the file
                #   modification timestamp is before the last sync, in case there
                #   are any images that were missed on a previous sync
                try:
                    image = Image.objects.get(filename=image_file_name)
                except DoesNotExist:
                    # Needs to sync
                    logging.info('Creating new image from file: %s' % image_file_name)
                    image = Image(filename=image_file_name)
                except MultipleObjectsReturned:
                    # TODO: this generally shouldn't happen, but should be handled
                    raise
                else:  # existing image found
                    if image.uploaded_at == file_modified_time:
                        # image unchanged, skip processing
                        continue
                    else:
                        logging.warning('Existing image was modified: %s' % image_file_path)
                        # find all existing views for the image and delete them
                        for view in View.objects(image=image.id):
                            try:
                                session.views.remove(view.id)
                            except ValueError:
                                # it's fine if the view wasn't in the session's list
                                pass
                            view.delete()

                reader = make_reader({
                    'fname': image_file_path,
                    'dir': 0,
                })
                reader.set_input_params({
                    'fname': image_file_path,
                })
                reader.parse_image_description()
                logging.info('Image barcode: %s' % reader.barcode)

                image.label = '%s (%s)' % (reader.barcode['str'], image_file_name)
                image.uploaded_at = file_modified_time
                image.dimensions = [reader.width, reader.height, 1]
                image.levels = get_max_depth(reader.width, reader.height, reader.tile_width)
                image.tile_size = reader.tile_width
                image.coordinate_system = 'Pixel'
                image.bounds = [0, reader.width-1, 0, reader.height-1, 0, 0]

                image.save()

                # create a new view
                view = View(image=image.id)
                view.save()
                new_views.append(RefItem(ref=view.id))

                updated_images.append(image.to_mongo())

            # newest images should be at the top of the session's view list
            session.views = list(reversed(new_views)) + session.views
            session.save()

            resp = {
                'count': len(ptiff_files),
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

            Session.objects(image_store=self, name=self.session_name).delete()

        # Wipes all the images
        return self.sync()
