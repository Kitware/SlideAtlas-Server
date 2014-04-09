__author__ = 'dhan'

import logging
import os
import glob
import sys

slideatlaspath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(slideatlaspath)

import mongoengine
from slideatlas.models.common import ModelDocument
from slideatlas.models import TileStore, Database, User 
import datetime


class PTiffStoreMixin(object):
    """
    Equivalent to images collections
    Should encapsulate entire assetstore, and this being tile specific version of it.

    This generalizaes "databases" collection which should ultimately point to asses collection
    with each asset object will have a type = MongoAssetStore if not specified

    - Ultimately image record has to be created in the metadatastore. And the image will Each asset store uses mongodb

    """

    def load_folder(self):
        self.before =   dict ([(f, None) for f in os.listdir (path_to_watch)])

    def sync(self):
        """
        Syncs the objects in mongodb with the
        """
        print self.__dict__

        searchpath = os.path.join(self.root_path, "*.ptif")
        logging.info(searchpath)
        logging.log(logging.INFO, searchpath)
        for aslide in glob.glob(searchpath):
            # logging.info("Got %s:"%(aslide))
            print os.stat(aslide)

            # if not os.path.exists(barcodepath):
            #     logging.log(logging.INFO, "Computing fname: %s, itype: %s" % (fname, itype))
            #     reader = make_reader({"fname" : aslide, "dir" : 0})
            #     reader.set_input_params({ "fname" : aslide })
            #     fout = open(barcodepath, "w")
            #     fout.write(reader.get_barcode_info())
            #     fout.close()
            #
            #
            # obj = {}
            # obj["name"] = os.path.split(aslide)[1]
            # obj["barcode"] = fin.read()
            # slides.append(obj)
        self.last_sync = datetime.datetime.now()

class PtiffTileStore(TileStore, PTiffStoreMixin):
    """
    The data model for TileStore 

    """
    last_sync = mongoengine.DateTimeField(required=True, default=datetime.datetime.min) #: Timestamp used to quickly new files
    root_path = mongoengine.StringField(required=True) #: Path of the folder where the incoming images arrive 
    images = mongoengine.StringField(required=True, default="ptiffimages") #: PTiffTileStore stores the images metadata in this collection

def test_ptiff_tile_store():
    store = PtiffTileStore(root_path="/home/dhan/data/phillips")
    logging.info("Last sync on initialization: %s"%(store.last_sync))
    # print store.root_path
    store.sync()
    logging.info("Last sync after sync: %s"%(store.last_sync))
    
def create_ptiff_store():
    store = PtiffTileStore(root_path="/home/dhan/data/phillips", 
        label="Phillips Scanner folder from wsiserver3", 
        copyright="Copyright &copy; 2011-13, Charles Palmer, Beverly Faulkner-Jones and Su-jean Seo. \
         All rights reserved.")
    
    print store.__dict__
    store.save()

def test_getlist():
    """
    .. code-block::
    
        db.databases.update({"_cls" : {"$exists" : 0}},{"$set" : { "_cls" : "TileStore.Database"}})
    
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
    test_getlist()
