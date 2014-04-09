__author__ = 'dhan'

import logging
import os
import glob
import sys
import mongoengine
from models.common import ModelDocument
from models.database import TileStore
import datetime

tilereaderpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../experiments"))
sys.path.append(tilereaderpath)


class PTiffStoreMixin():
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
        searchpath = os.path.join(self.params["path"], "*.ptif")
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
            #

        pass


class PtiffTileStore(TileStore, PTiffStoreMixin):
    """
    The data model for TileStore 

    """
    last_sync = mongoengine.DateTimeField(required=True, default=datetime.datetime.min) #: Timestamp used to quickly new files
    root_path = mongoengine.StringField(required=True) #: Path of the folder where the incoming images arrive 
    images = mongoengine.StringField(required=True, default="ptiffimages") #: PTiffTileStore stores the images metadata in this collection

def test_ptiff_tile_store():
    store = PtiffTileStore(path="/home/dhan/data/phillips")

    


if __name__ == "__main__":
    """
    Run few tests
    This class will be finally imported from tiff server
    """
    
    logging.getLogger().setLevel(logging.INFO)
    test_ptiff_tile_store()
