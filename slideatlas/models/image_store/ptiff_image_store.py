# coding=utf-8

import base64
import datetime
import glob
import logging
import os
import platform
import re
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
from ..session import Collection, Session, RefItem

from slideatlas.common_utils import reversed_enumerate
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

    host_name = StringField(required=True,
        verbose_name='Host Name', help_text='The name of the host that the image files reside on.')

    root_path = StringField(required=True,
        verbose_name='Root Path', help_text='Location on local filesystem for image files.')

    @property
    def default_session_label(self):
        return 'All'


    def is_local(self):
        return platform.node() == self.host_name


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

        # Locate the tile name from x and y
        pixel_x = index_x * tile_size + 5
        pixel_y = index_y * tile_size + 5

        tile_buffer = StringIO.StringIO()
        reader_result = reader.dump_tile(pixel_x, pixel_y, tile_buffer)

        if reader_result == 0:
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

        # Load the stored images
        label_image = PImage.open(StringIO.StringIO(base64.b64decode(reader.get_embedded_image('label'))))
        macro_image = PImage.open(StringIO.StringIO(base64.b64decode(reader.get_embedded_image('macro'))))

        if label_image == None or macro_image == None:
            # TODO: Handle cases where the t.jpg are not stored
            return self.get_tile(image.id, 't.jpg')

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


    def _import_new_images(self):
        # place new images in the default session
        try:
            session = Session.objects.get(image_store=self, label=self.default_session_label)
        except DoesNotExist:
            raise
            # TODO: need a collection to create the new session in
            # session = Session(image_store=self, label=self.default_session_label)
        except MultipleObjectsReturned:
            # TODO: this generally shouldn't happen, but should be handled
            raise

        with self:
            new_images = list()

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
                        # image unchanged as expected, skip processing
                        continue
                    else:
                        logging.warning('Existing image was modified: %s' % image_file_path)

                reader = make_reader({
                    'fname': image_file_path,
                    'dir': 0,
                })
                reader.set_input_params({
                    'fname': image_file_path,
                })
                reader.parse_image_description()
                logging.info('Image barcode: %s' % reader.barcode)

                if len(reader.barcode) > 0:
                    image.label = '%s (%s)' % (reader.barcode, image_file_name)
                else:
                    # No barcode
                    image.label = image_file_name

                image.uploaded_at = file_modified_time
                image.dimensions = [reader.width, reader.height, 1]
                image.levels = get_max_depth(reader.width, reader.height, reader.tile_width)
                image.tile_size = reader.tile_width
                image.coordinate_system = 'Pixel'
                image.bounds = [0, reader.width-1, 0, reader.height-1, 0, 0]

                # need to save images to give it an id
                image.save()

                view = View(image=image.id)
                view.save()

                # newest images should be at the top of the session's view list
                logging.error('adding view %s to session %s' % (view.id, session._get_collection()))
                session.views.insert(0, RefItem(ref=view.id, db=self.id))
                session.save()

                new_images.append(image.to_mongo())
        return new_images


    def _deliver_views_to_inboxes(self):

        # '_import_new_images' will have been called previously, so we can assume
        #   that a default session exists
        default_session = Session.objects.get(image_store=self, label=self.default_session_label)

        with self:
            # reverse to start with the oldest views at the end of the list, and
            #   more importantly, to permit deletion from the list while iterating
            for view_ref_pos, view_ref in reversed_enumerate(default_session.views):
                view = View.objects.only('image').with_id(view_ref.ref)
                image = Image.objects.only('label', 'filename').with_id(view.image)

                # get creator_code
                # TODO: move the creator_code to a property of Image objects
                creator_code_match = re.match(r'^ *([a-zA-Z- ]+?)[0-9 _-]*\|', image.label)
                if not creator_code_match:
                    logging.warning('Could not read creator code from barcode "%s" in image: %s' % (image.label, image.filename))
                    continue
                creator_code = creator_code_match.group(1)

                # try to find the corresponding collection
                try:
                    collection = Collection.objects.get(creator_codes=creator_code)
                except DoesNotExist:
                    logging.warning('Collection for creator code "%s" not found' % creator_code)
                    continue
                except MultipleObjectsReturned:
                    logging.error('Multiple collections for creator code "%s" found' % creator_code)
                    continue

                # get the inbox session for the collection
                try:
                    inbox_session = Session.objects.get(collection=collection, label='Inbox')
                except DoesNotExist:
                    # TODO: remove the image_store field, it shouldn't be required
                    inbox_session = Session(collection=collection,
                                            image_store=self,
                                            label='Inbox')
                except MultipleObjectsReturned:
                    # TODO: this generally shouldn't happen, but should be handled
                    raise

                # move the session
                default_session.views.pop(view_ref_pos)
                inbox_session.views.insert(0, view_ref)

                # save destination session first, duplicate is preferable to dropped
                inbox_session.save()
                default_session.save()
                logging.info('Delivered image: %s' % image.label)


    def sync(self):
        """
        Syncs the objects in Image Session and View with the files in given folder.

        - Verifies that all images referred in image collection are available in the file store.
        - Finds out new files are not yet added to the store
        - Creates a view for these in the session with a matching "image creator code" or 'self.default_session_label' session

        It is assumed that the modification dates to any changes to folder are intact
        """
        if not self.is_local():
            # TODO: raise exception?
            return

        new_images = self._import_new_images()

        self.last_sync = datetime.datetime.now()
        self.save()

        resp = {
            'count': None, # TODO: deprecated
            'synced': len(new_images),
            'images': new_images,
        }
        return resp


    def deliver(self):
        if not self.is_local():
            # TODO: this may be performed non-locally
            return
        self._deliver_views_to_inboxes()
