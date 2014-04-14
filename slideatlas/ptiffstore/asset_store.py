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
from slideatlas.ptiffstore.reader_cache import make_reader

class PTiffStoreMixin(object):
    """
    Equivalent to images collections
    Should encapsulate entire assetstore, and this being tile specific version of it.

    This generalizaes "databases" collection which should ultimately point to asses collection
    with each asset object will have a type = MongoAssetStore if not specified

    All sessions are stored in admindb in ptiffsessions and images are stored in ptiffimages
    expects the model to have 
    """

    def load_folder(self):
        self.before =   dict ([(f, None) for f in os.listdir (path_to_watch)])

    def sync(self):
        """
        Syncs the objects in mongodb with the
        """
        # print self.__dict__

        searchpath = os.path.join(self.root_path, "*.ptif")
        # logging.info(searchpath)
        for aslide in glob.glob(searchpath):
            # logging.info("Got %s:"%(aslide))
            # filestatus =  os.stat(aslide)
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(aslide))
            # logging.info("%s, %s, %s"%(aslide, mtime, self.last_sync))

            if self.last_sync < mtime :
                logging.info("Needs refresh: %s"%(aslide))  
                # Locate the record 

                # logging.log(logging.INFO, "Reading file: %s, itype: %s" % (fname, itype))
                reader = make_reader({"fname" : aslide, "dir" : 0})
                reader.set_input_params({ "fname" : aslide })
                logging.error(reader.get_barcode_info())
            
                # obj = {}
                # obj["name"] = os.path.split(aslide)[1]
                # obj["barcode"] = fin.read()
                # slides.append(obj)
 
            else:
                logging.info("Is good: %s"%(aslide))  

        self.save()

    
    def resync(self):
        self.last_sync = datetime.datetime.fromtimestamp(0)
        self.save()
        self.sync()

    

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

from bson import ObjectId
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
