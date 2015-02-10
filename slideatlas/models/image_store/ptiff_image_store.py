# coding=utf-8

import base64
import datetime
import fcntl
import glob
import os
import platform
import re
import shutil
try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

from flask import current_app
from mongoengine import DateTimeField, StringField, DoesNotExist, \
    MultipleObjectsReturned
from PIL import Image as PImage

from .image_store import MultipleDatabaseImageStore
from ..image import Image
from ..view import View
from ..session import Collection, Session

from slideatlas.common_utils import reversed_enumerate, file_sha512
from slideatlas.ptiffstore.reader_cache import make_reader
from slideatlas.ptiffstore.common_utils import get_max_depth, get_tile_index

################################################################################
__all__ = ('PtiffImageStore',)


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

    @property
    def import_dir_path(self):
        return os.path.join(current_app.config['SLIDEATLAS_IMPORT_ROOT'], self.dbname)

    @property
    def default_session_label(self):
        return 'All'

    def image_file_path(self, image):
        image_hash = image.sha512
        return os.path.join(
            current_app.config['SLIDEATLAS_IMAGE_STORE_ROOT'],
            self.dbname,
            image_hash[0:2],
            image_hash[2:4],
            image_hash
        )

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
        tiff_path = self.image_file_path(image)

        index_x, index_y, index_z = get_tile_index(tile_name[:-4], invert=False)

        reader = make_reader({
            'fname': tiff_path,
            'dir': image.levels - index_z - 1,
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
        try:
            return self.make_thumb_from_embedded_images(image)
        except:
            return self.make_thumb(image)


    def make_thumb(self, image, max_depth=3):
        """
        Makes thumb by requesting tiles. Will not make
        """
        try:
            output = self.get_tile(image.id, "t.jpg", )
        except DoesNotExist:
            # print "Did not exit"
            # Grab other tiles

            white_tile = PImage.new("RGB", (256,256), 'white')

            # Open the children tiles as PIL image
            img = PImage.new("RGB", (256,256), 'pink')
            buf = StringIO.StringIO()
            img.save(buf, format="jpeg")
            output = buf.getvalue()
            del buf
        return output


    def make_thumb_from_embedded_images(self, image):
        """
        Returns a thumbnail with a label as a binary JPEG string.
        """
        tiff_path = self.image_file_path(image)

        reader = make_reader({
            'fname': tiff_path,
            'dir': 0,
        })

        # TODO: create a separate call for parsing embedded images
        reader.parse_image_description()

        # Load the stored images
        label_image = PImage.open(StringIO.StringIO(base64.b64decode(reader.get_embedded_image('label'))))
        macro_image = PImage.open(StringIO.StringIO(base64.b64decode(reader.get_embedded_image('macro'))))

        if label_image is None or macro_image is None:
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


    def _import_image(self, import_file_path):
        import_file_name = os.path.basename(import_file_path)
        current_app.logger.info('Importing Image %s to ImageStore %s', import_file_name, self)

        with open(import_file_path) as import_file:
            # lock the image against other tasks trying to import it
            # while "lockf" is better supported on some remote file systems, it
            #   cannot be used unless the file is opened for writing, which updates
            #   the modification time and may interfere with other desirable read
            #   operations; "flock" doesn't have this limitation, and is
            #   supported by GlusterFS
            # this will raise an IOError if the lock can't be acquired
            try:
                fcntl.flock(import_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except IOError:
                current_app.logger.warning('Could not get file lock to import %s to ImageStore %s', import_file_path, self)
                return None

            # hash image file
            image_hash = file_sha512(import_file_path)

            # ensure that this is a new image
            try:
                with self:
                    image = Image.objects.get(sha512=image_hash)
            except DoesNotExist:
                pass
            except MultipleObjectsReturned:
                # TODO: this generally shouldn't happen, but should be handled
                raise
            else:  # existing image found
                current_app.logger.warning(
                    'Attempt to import duplicate new Image from %s to ImageStore %s containing existing Image %s with filename %s',
                    import_file_name, self, image, image.filename)
                storage_file_path = self.image_file_path(image)
                if os.path.exists(storage_file_path):
                    os.remove(import_file_path)
                else:
                    current_app.logger.error(
                        'Existing Image %s missing from ImageStore %s filesystem at %s',
                        image, self, storage_file_path)
                # TODO: return something special?
                return None

            # setup and execute image reader
            reader = make_reader({
                'fname': import_file_path,
                'dir': 0,
            })
            reader.set_input_params({
                'fname': import_file_path,
            })
            reader.parse_image_description()

            # create new image
            with self:
                image = Image(
                    sha512=image_hash,
                    filename=import_file_name,
                    uploaded_at=datetime.datetime.fromtimestamp(os.path.getmtime(import_file_path)),
                    label='%s (%s)' % (reader.barcode, import_file_name) if reader.barcode else import_file_name,
                    dimensions=[reader.width, reader.height, 1],
                    levels=get_max_depth(reader.width, reader.height, reader.tile_width),
                    tile_size=reader.tile_width,
                    bounds=[0, reader.width - 1, 0, reader.height - 1, 0, 0],
                    coordinate_system='Pixel',
                )
                image.save()

            # TODO: ensure any file handles that the reader has are closed
            del reader

            # move the file into the ImageStore filesystem
            storage_file_path = self.image_file_path(image)
            storage_dir_path = os.path.dirname(storage_file_path)
            if not os.path.exists(storage_dir_path):
                os.makedirs(storage_dir_path)

            # it's possible that a file already exists at this point, due to a
            #   race condition with duplicate imports; however, rename *should*
            #   silently overwrite the file with identical data
            # TODO: verify this fact

            shutil.move(import_file_path, storage_file_path)
            # TODO: change permissions?
            # os.chmod(storage_file_path, stat.S_IRUSR | stat.S_IWUSR)

            fcntl.flock(import_file, fcntl.LOCK_UN)

            return image


    def _import_view(self, session, image):
        view = View(ViewerRecords=[{'Image': image.id, 'Database': self.id}])
        view.save()

        current_app.logger.info('Importing new View %s to Session %s/%s', view, session.collection, session)
        session.update(__raw__={'$push': {'views': {
            '$each': [view.id],
            '$position': 0
        }}})
        # session.views.insert(0, view.id)
        # session.save()


    def _import_images(self):
        import_dir_path = self.import_dir_path
        current_app.logger.info('Importing images in %s to %s', import_dir_path, self)
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

        import_search_path = os.path.join(import_dir_path, '*.ptif')
        # sorting will be by modification time, with earliest first
        for import_file_path in sorted(
                glob.glob(import_search_path),
                key=lambda file_path: os.path.getmtime(file_path)):
            image = self._import_image(import_file_path)
            if image:
                self._import_view(session, image)


    def _deliver_views_to_inboxes(self):
        current_app.logger.info('Delivering images from %s', self)
        # '_import_new_images' will have been called previously, so we can assume
        #   that a default session exists
        default_session = Session.objects.get(image_store=self, label=self.default_session_label)

        with self:
            # reverse to start with the oldest views at the end of the list, and
            #   more importantly, to permit deletion from the list while iterating
            for view_id_pos, view_id in reversed_enumerate(default_session.views):
                view = View.objects.only('ViewerRecords').with_id(view_id)
                image = Image.objects.only('label', 'filename').with_id(view.ViewerRecords[0]['Image'])

                # get creator_code
                # TODO: move the creator_code to a property of Image objects
                creator_code_match = re.match(r'^ *([a-zA-Z- ]+?)[0-9 _-]*\|', image.label)
                if not creator_code_match:
                    current_app.logger.warning('Could not read creator code from barcode "%s" in image: %s', image.label, image.filename)
                    continue
                creator_code = creator_code_match.group(1)

                # try to find the corresponding collection
                try:
                    collection = Collection.objects.get(creator_codes=creator_code)
                except DoesNotExist:
                    current_app.logger.warning('Collection for creator code "%s" not found' % creator_code)
                    continue
                except MultipleObjectsReturned:
                    current_app.logger.error('Multiple collections for creator code "%s" found' % creator_code)
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
                default_session.views.pop(view_id_pos)
                inbox_session.views.insert(0, view_id)

                # save destination session first, duplicate is preferable to dropped
                inbox_session.save()
                default_session.save()
                current_app.logger.info('Delivered image: %s' % image.label)


    def import_images(self):
        if not self.is_local():
            # TODO: raise exception?
            return

        self._import_images()

        self.last_sync = datetime.datetime.now()
        self.save()


    def deliver(self):
        if not self.is_local():
            # TODO: this may be performed non-locally
            return
        self._deliver_views_to_inboxes()
