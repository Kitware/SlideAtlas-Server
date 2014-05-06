# coding=utf-8

import datetime
import glob
import logging
import os
import StringIO

from mongoengine import DateTimeField, StringField

from slideatlas.models import Database, Image, RefItem ,Session, TileStore, \
    View, DoesNotExist, MultipleObjectsReturned
from slideatlas.ptiffstore.reader_cache import make_reader
from slideatlas.ptiffstore.common_utils import get_max_depth
from common_utils import getcoords

################################################################################
logger = logging.getLogger("slideatlas.ptiffstore")


################################################################################
class PtiffTileStore(Database):
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


    def get_tile(self, img, name):
        """
        Function redefinition to get_tile
        Raises exceptions that must be caught by the calling routine
        """

        with self:
            img = Image.objects.get_or_404(id=img)

        tile_size = img.tile_size
        tiff_path = os.path.join(self.root_path, img.filename)

        [x, y, z] = getcoords(name[:-4])

        reader = make_reader({
            'fname': tiff_path,
            'dir': img.levels - z -1,
        })
        logging.info('Viewing fname: %s' % tiff_path)

        # Locate the tile name from x and y
        locx = x * tile_size + 5
        locy = y * tile_size + 5

        fp = StringIO.StringIO()
        r = reader.dump_tile(locx, locy, fp)

        if r > 0:
            logging.log(logging.ERROR, 'Read %d bytes' % r)
        else:
            raise Exception('Tile not read')

        return fp.getvalue()

    def load_folder(self):
        # TODO: 'path_to_watch' is not defined
        self.before = dict ((f, None) for f in os.listdir (path_to_watch))

    def _remove_image(self, id):
        pass

    def _add_image(self, filename):
        pass

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
                    logging.error('Needs refresh: %s' % image_file_path)

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
                        logging.log(logging.ERROR, 'Reading file: %s' % image_file_name)
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
                        # Also insert in the session
                        # Determine the session
                        # Find the session
                        # Find the view and delete if found
                        views = View.objects(image=image.id)
                        for view in views:
                            view.delete()

                            idx = []
                            # Delete view from session
                            for i in range(len(session.views)):
                                if session.views[i].ref == view.id:
                                    logger.error('To Remove: %s' % session.views[i].ref)
                                    idx.append(i)
                            logger.error('Total: %s' % str(i))
                        view = View(img=image.id)
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


# class PhillipsImageMixin(object):
#     """
#     Methods and business logic for ptiff images coming from phillips
#     """
#     pass

# class PhillipsImage(Image, PhillipsImageMixin):
#     """
#     Data models for ptiff images based on mongoengine
#     """

#     barcode = StringField(required=True, #TODO: filename with respect to root_path
#         verbose_name='Barcode', help_text='Bar code string')


def test_ptiff_tile_store():
    store = PtiffTileStore(root_path="/home/dhan/data/phillips")
    logging.info("Last sync on initialization: %s"%(store.last_sync))
    # print store.root_path
    store.sync()
    logging.info("Last sync after sync: %s"%(store.last_sync))

def test_modify_store():
    for obj in PtiffTileStore.objects:
        logging.info("Synchronizing ptiff store: %s", obj.label)
        obj.resync()


def create_ptiff_store():
    store = PtiffTileStore(root_path="/home/dhan/data/phillips",
        label="Phillips Scanner folder from wsiserver3",
        copyright="Copyright &copy; 2011-13, Charles Palmer, Beverly Faulkner-Jones and Su-jean Seo. All rights reserved.")

    # print store.__dict__
    store.save()

def test_getlist():
    """
    .. code-block:: javascript

        db.databases.update({"_cls" : {"$exists" : 0}},{"$set" : { "_cls" : "TileStore.Database"}}, {"multi" : true })

    """


    print "getting list"

    # # Getting user list works perfectly
    # for obj in User.objects():
    #     print obj

    # Getting user list works perfectly
    for obj in Database.objects:
        print "Gotit"
        print obj

    # for obj in TileStore.objects():
    #     print obj

def test_items_mongoengine():
    # .with_id(ObjectId("53482d5a0a3ee1346135d805"))
    print
    print "TileStore"
    for obj in TileStore.objects:
        print obj._cls, obj.label
    print
    print "Database"
    for obj in Database.objects:
        print obj._cls, obj.label

    print
    print "PtiffTileStore"
    for obj in PtiffTileStore.objects:
        print obj._cls, obj.label



if __name__ == "__main__":
    """
    Run few tests
    This class will be finally imported from tiff server
    """

    logging.getLogger().setLevel(logging.INFO)

    # This is required so that model gets registered
    from slideatlas import create_app
    app = create_app()

    # test_ptiff_tile_store()
    # create_ptiff_store()
    # test_getlist()
    # test_items_mongoengine()
    test_modify_store()
