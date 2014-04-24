__author__ = 'dhan'

import logging

logger = logging.getLogger("slideatlas.ptiffstore")
import os
import glob
import sys
import StringIO

slideatlaspath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(slideatlaspath)

import mongoengine
from slideatlas.models import Image, View

from slideatlas.models import TileStore, Database, Session, RefItem
import datetime
from slideatlas.ptiffstore.reader_cache import make_reader
from slideatlas.ptiffstore.common_utils import get_max_depth
from common_utils import getcoords

class PtiffTileStore(Database):
    """
    The data model for PtiffStore

    Equivalent to images collections
    Should encapsulate entire assetstore, and this being tile specific version of it.

    This generalizaes "databases" collection which should ultimately point to asses collection
    with each asset object will have a type = MongoAssetStore if not specified

    All sessions are stored in admindb in ptiffsessions and images are stored in ptiffimages
    expects the model to have
    """
    last_sync = mongoengine.DateTimeField(required=True, default=datetime.datetime.min) #: Timestamp used to quickly new files
    root_path = mongoengine.StringField(required=True) #: Path of the folder where the incoming images arrive


    def get_tile(self, img, name):
        """
        Function redefinition to get_tile
        Raises exceptions that must be caught by the calling routine
        """

        with self:
            img = Image.objects.get_or_404(id=img)

        tiffpath = os.path.join(self.root_path, img.filename)

        [x, y, z] = getcoords(name[:-4])

        reader = make_reader({"fname" : tiffpath, "dir" : img.levels - z -1})
        logging.log(logging.INFO, "Viewing fname: %s" % (tiffpath))

        # Locate the tilename from x and y

        locx = x * 512 + 5
        locy = y * 512 + 5

        fp = StringIO.StringIO()
        r = reader.dump_tile(locx,locy, fp)

        if r > 0:
            logging.log(logging.ERROR, "Read %d bytes"%(r))
        else:
            raise Exception("Tile not read")

        return fp.getvalue()

    def load_folder(self):
        self.before =   dict ([(f, None) for f in os.listdir (path_to_watch)])

    def sync(self):
        """
        Syncs the objects in mongodb with the
        """
        # print self.__dict__

        resp = {}
        searchpath = os.path.join(self.root_path, "*.ptif")
        # logging.info(searchpath)
        count = 0
        synced = 0
        images = []

        session_name = "All"

        with self:
            # Find the session
            try:
                sess = Session.objects(name=session_name)[0]
            except:
                sess = None

            if sess == None:
                sess = Session(name=session_name, label=session_name)


        for aslide in glob.glob(searchpath):

            count = count + 1
            # logging.info("Got %s:"%(aslide))
            # filestatus =  os.stat(aslide)
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(aslide))
            # logging.info("%s, %s, %s"%(aslide, mtime, self.last_sync))

            if self.last_sync < mtime :
                logging.error("Needs refresh: %s"%(aslide))

                fname = os.path.split(aslide)[1]
                reader = make_reader({"fname" : aslide, "dir" : 0})
                reader.set_input_params({ "fname" : aslide })
                reader.parse_image_description()
                logging.info(reader.barcode)
                newimage = False
                with self:
                    # Locate the record
                    try:
                        animage = Image.objects(filename=fname)[0]
                    except:
                        animage = None

                    if animage == None:
                        # Needs to sync
                        animage = Image()
                        logging.log(logging.ERROR, "Reading file: %s" % (fname))

                        animage.filename = fname
                        animage.label = reader.barcode["str"] + " (" + fname + ")"
                        animage.dimensions = [reader.width, reader.height, 1]
                        animage.levels = get_max_depth(reader.width, reader.height, reader.tile_width)
                        animage.TileSize= reader.tile_width
                        animage.CoordinateSystem = "Pixel"
                        animage.bounds = [0, reader.width-1, 0, reader.height-1, 0,0 ]
                        newimage = True
                    else:
                        animage.filename = fname
                        animage.label = reader.barcode["str"] + " (" + fname + ")"
                        animage.dimensions = [reader.width, reader.height, 1]
                        animage.levels = get_max_depth(reader.width, reader.height, reader.tile_width)
                        animage.TileSize= reader.tile_width
                        animage.CoordinateSystem = "Pixel"
                        animage.bounds = [0, reader.width-1, 0, reader.height-1, 0,0 ]

                    animage.save()

                    if newimage:
                        # Also insert in the session

                        # Determine the session
                        with self:
                            # Find the session

                            aview = View(img=animage.id)
                            aview.save()

                            sess.views.append(RefItem(ref=aview.id))

                    images.append(animage.to_mongo())
                # logging.info(reader.width)
                synced = synced + 1

                # obj = {}
                # obj["name"] = os.path.split(aslide)[1]
                # obj["barcode"] = fin.read()
                # slides.append(obj)

            else:
                logging.info("Is good: %s"%(aslide))
        sess.transformations = []
        sess.save()
        resp["count"] = count
        resp["synced"] = synced
        resp["images"] = images
        self.last_sync = datetime.datetime.now()
        self.save()
        return resp

    def resync(self):
        """
        May overwrite all the information in that database
        """
        self.last_sync = datetime.datetime.fromtimestamp(0)
        self.save()
        return self.sync()


class PhillipsImageMixin(object):
    """
    Methods and business logic for ptiff images coming from phillips
    """
    pass

class PhillipsImage(Image, PhillipsImageMixin):
    """
    Data models for ptiff images based on mongoengine
    """

    barcode = mongoengine.StringField(required=True, #TODO: filename with respect to root_path
        verbose_name='Barcode', help_text='Bar code string')


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
        copyright="Copyright &copy; 2011-13, Charles Palmer, Beverly Faulkner-Jones and Su-jean Seo. \
         All rights reserved.")

    print store.__dict__
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
    from slideatlas import app

    # test_ptiff_tile_store()
    # create_ptiff_store()
    # test_getlist()
    # test_items_mongoengine()
    test_modify_store()
