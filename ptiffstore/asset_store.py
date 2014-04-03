__author__ = 'dhan'

import logging
import os
import glob
import sys
import mongoengine



tilereaderpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../experiments"))
sys.path.append(tilereaderpath)


# Abstract definitions for asset store

class TileAssetsStore():
    """
    Equivalent to images collections
    Should encapsulate entire assetstore, and this being tile specific version of it.

    This generalizaes "databases" collection which should ultimately point to asses collection
    with each asset object will have a type = MongoAssetStore if not specified

    - Ultimately image record has to be created in the metadatastore. And the image will Each asset store uses mongodb

    """
    def __init__(self, params):
        """

        """
        self.params = params
        self.sync()

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


if __name__ == "__main__":
    """
    Run few tests
    This class will be finally imported from tiff server
    """

    logging.getLogger().setLevel(logging.INFO)
    store = TileAssetsStore({"path" : "/home/dhan/data/phillips", "mongo_server" : "127.0.0.1:27017", "mongo_database" : "tile_try", "mongo_collection" : "images"})
