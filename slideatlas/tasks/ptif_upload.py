# ptif_uploader script / webhook

# The developement has been resumed from uploader_jyhton
# Designed to use models from slide-atlas
__author__ = 'dhan'

#TODO: Extend the uploader for
# - Wrapping c++ image_uploader for ndpi and jp2 images

import os
from celery import Celery
from celery.task.control import inspect
from celery.result import AsyncResult
import time
import sys
import json
import argparse
import cStringIO as StringIO
from math import floor
import subprocess

import logging
logging.basicConfig()
rootLogger = logging.getLogger()
logger = logging.getLogger("slideatlas.ptif_uploader")
logger.setLevel(logging.INFO)

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")
from slideatlas import create_celery_app
from slideatlas  import create_app
from slideatlas.models import Collection, Session, MultipleDatabaseImageStore, ImageStore, RefItem, Image

from slideatlas.ptiffstore.tiff_reader import TileReader
from slideatlas.ptiffstore.common_utils import get_max_depth, get_tile_name_slideatlas


from bson import ObjectId, Binary
from bson.objectid import InvalidId
import pymongo

# Create teh application objects
flaskapp = create_app()
celeryapp = create_celery_app(flaskapp)


class Reader(object):
    """
    Generic reader for uploader
    """
    def __init__(self, params=None):
        if params:
            self.set_input_params(params)

    def set_input_params(self, params):
        self.params = params

class WrapperReader(Reader):
    def __init__(self, params=None):
        super(WrapperReader, self).__init__(params)

    def set_input_params(self, params):
        """
        Resets the state of the reader to the default using inputs provided
        """
        super(WrapperReader, self).set_input_params(params)

        logger.info("Received following input params: %s"%(params))
        fullname = params["fname"]
        name = os.path.basename(fullname)
        self.name = name

        # Perform extension specific operation here
        extension = os.path.splitext(fullname)

        # params = ["./image_uploader", "-m", "new.slide-atlas.org", "-d", istore.dbname, "-n", self.params["fname"]]
        # if len(istore.username) > 0:
        #     params = params + ["-u", istore.username, "-p", istore.password]

        args = ["./image_uploader", "-n", self.params["fname"]]

        # Get the information in json
        try:
            output = subprocess.Popen   (args, stdout=subprocess.PIPE, cwd=self.params["bindir"]).communicate()[0]
        except OSError as e:
            logger.error("Fatal error from OS while executing image_uploader (possible incorrect --bindir): %s"%e.message)
            sys.exit(0)

        js = {}
        try :
            js = json.loads(output)
        except:
            logger.error("Fatal error Output of image_uploader not valid json: %s"%output)
            sys.exit(0)

        logger.info("JS: %s"%(js))

        if js.has_key('error'):
            anitem.textStatus.SetLabel("Error")
            logger.error("Fatal error UNREADABLE input:\n%s"%(output))
            sys.exit(0)

        if not js.has_key("information"):
            logger.error("Fatal error NO INFORMATION")
            sys.exit(0)

        self.width = js["dimensions"][0]
        self.height = js["dimensions"][1]
        self.num_levels = js["levels"]
        # # Should have connection info
        # if not js.has_key('connection'):
        #     logger.error("Fatal error NO CONNECTION")
        #     sys.exit(0)






class MongoUploader(object):
    """
    Define common interface to interact with slide-atlas models
    Subclasses define
    """
    def __init__(self, args):
        """
        Common initialization
        """
        self.imageid = None  #: Id of the image collection to write to. It is not set initially but the init process will set it according to input parameter
        self.args = args

        self.upload()

    def upload(self):
        """
        Implements basic workflow for interpreting arguments and uploading
        """

        # Locate the destination
        try:
            if self.args.mongo_collection:
                # Remove any image object and collection of that name
                self.imageid = ObjectId(self.args.mongo_collection)
                logger.info("Using specified ImageID: %s"%(self.imageid))
            else:
                self.imageid = ObjectId()
                logger.info("Using specified ImageID: %s"%(self.imageid))

        except InvalidId:
            logger.error("Invalid ObjectID for mongo collection: %s"%(self.args.mongo_collection))

        # Load reader
        self.reader = self.make_reader()
        logger.warning("%s"%self.reader)
        # Load image store
        self.setup_destination(args.collection)

        # Insert image record
        self.insert_metadata()

        # Upload base / level

        # build pyramid

        self.update_collection()

        # Image collection is ready,
            # now add to the collection

        # Create a view

        # Done !
    def update_collection(self):
        """
        Update the collection

        i.e. Create a view, add the view to the session
        """

        logger.error("update_collection is not implemented yet")
        sys.exit(1)

    def make_reader(self):
        logging.error("make_reader Not implemented")
        sys.exit(1)

    def setup_destination(self, collection):
        """
            Get the destination session in the collection
        """
        with flaskapp.app_context():
            # Locate the session

            self.coll = Collection.objects.get(id=ObjectId(self.args.collection))
            logger.info("collection: %s"%(self.coll.to_son()))

            self.imagestore = self.coll.image_store
            logger.info("imagestore: %s"%(self.imagestore.to_son()))

    # def get_metadata(self):
    #     """
    #     Each implementation would implement its own
    #     """


    def insert_metadata(self):
        """
        Inserts the created image metadata object if the flags permit
        and connection established

        Expects self.imagestore and self.reader to be set
        """

        if self.imagestore == None:
            logger.error("Fatal Error: Imagestore not set")
            sys.exit(1)

        with flaskapp.app_context():
            with self.imagestore:
                image_doc = Image()
                image_doc["filename"]= self.reader.name
                image_doc["label"]= self.reader.name
                image_doc["origin"] = [0,0,0]
                image_doc["spacing"] = [1.0,1.0, 1.0] #TODO: Get it from the data
                image_doc["dimensions"] =[self.reader.width, self.reader.height]
                image_doc["bounds"] = [0, self.reader.width, 0, self.reader.height]
                image_doc["levels"] = self.reader.num_levels
                image_doc["components"] = 3 # TODO: Get it from the data
                image_doc["metadataready"] = True
                image_doc["id"] = self.imageid

                if self.args.dry_run:
                    logger.info("Dry run .. not creating image record: %s"%(image_doc.to_son()))
                else:
                    image_doc.save()



class MongoPtifUploader(MongoUploader):
    """
    Class for uploading ptif tiles into mongodb collection
    """
    def make_reader(self):
        """
        Creates a ptif reader
        """
        try:
            reader = TileReader()
            reader.set_input_params({"fname" : self.args.input })

            # Introspect
            logger.info("Dimensions: (%d, %d)"%(reader.width, reader.height))
            reader.parse_image_description()
            logger.info("Tilesize: %d, NoTiles: %d"%(reader.tile_width, reader.num_tiles))
        except:
            logger.error("Fatal Error: Unable to read input file %s"%(self.args.input))
            return -1

        return reader

    def __init__(self, args):
        """
        Expects -

            input
            imagestore
            collection
            tilesize
            mongo-collection
            force
            dry-run
            verbose
            parallel

        """

        super(MongoPtifUploader, self).__init__(args)

        # Check the input
        # TODO: Whether the input is a url
        # input is a slideatlas endpoint if "https://slide-atlas.org/api/v2/sessions/53cd6a5c81652c3a70d89976/attachments/53ce8f8fdd98b56dcb926d01"

        fname = os.path.split(self.args.input)[1]

        # Get the destination session in the collection
        # try:
        with flaskapp.app_context():
            # Locate the session

            coll = Collection.objects.get(id=ObjectId(self.args.collection))
            print "collection: ", coll.to_son()

            imagestore = coll.image_store
            print "imagestore: ", imagestore.to_son()

            session = Session.objects.get(id=ObjectId(self.args.session))
            print "session: ", session

        # except Exception as e:
        #     logger.error("Fatal Error: %s"%(e.message))
        #     return -1

        # Create image record
        with flaskapp.app_context():
            with imagestore:
                if self.args.mongo_collection:
                    try:
                        Image.objects.get(id=imageid)
                        Image.objects.remove(id=imageid)
                    except:
                        # As expected
                        pass

                image_doc = Image()
                image_doc["filename"]= fname
                image_doc["label"]= fname
                image_doc["origin"] = [0,0,0]
                image_doc["spacing"] = [1.0,1.0, 1.0] #TODO: Get it from the data
                image_doc["dimensions"] =[reader.width, reader.height]
                image_doc["bounds"] = [0, reader.width, 0, reader.height]
                image_doc["levels"] = len(reader.levels)
                image_doc["components"] = 3 # TODO: Get it from the data
                image_doc["metadataready"] = True
                image_doc["id"] = imageid

        # Upload the base
        try:
            if imagestore.replica_set:
                conn = pymongo.ReplicaSetConnection(imagestore.host, replicaSet=imagestore.replica_set)
                db = conn[imagestore.dbname]
                db.authenticate(imagestore.username, imagestore.password)
        except:
            logger.error("Fatal Error: Unable to connect to imagestore for inserting tiles")
            return -1


        if self.args.mongo_collection:
            #Check whether the collection exists
            # Removing the collections
            if self.args.dry_run:
                logger.info("Dry run .. not removing original image chunks")
            else:
                db.drop_collection(self.args.mongo_collection)

        if self.args.base_only:
            self.upload_level(reader, db, imageid, level=0, dry_run=self.args.dry_run)
        else:
            # Get the number of levels
            for i in range(len(reader.levels)):
                self.upload_level(reader, db, imageid, level=i, dry_run=self.args.dry_run)

        # # Temp for testing
        # # Insert the record in the session
        # imageid = ObjectId("53d0a1010a3ee130811cc5df")
        # new_view_id = ObjectId("53d0a4da0a3ee1316edaa5aa")

        if self.args.dry_run:
            logger.info("Exiting .. dry run .. so no view or session update")
            return

        # Create a view
        colviews = db["views"]
        new_view_id = ObjectId()
        colviews.insert({"img" : ObjectId(imageid) ,  "_id" : new_view_id})
        logger.warning("New view id: %s"%(new_view_id))

        item = RefItem()
        item.ref = new_view_id
        item.db = ObjectId(imagestore.id)

        session.views.append(item)
        session.save()

    def upload_level(self, reader, db, imageid, level=0, dry_run=False):
        """
        Uploads a given level
        expects reader, db, imageid already stored in the __self__
        """
        # Insert tiles
        reader.select_dir(level)

        logger.info("#### Uploading level %d"%(level))
        col = int(reader.width / reader.tile_width) + 1
        row = int(reader.height / reader.tile_height) + 1

        # Good old for loop
        count = 0
        for tilex in range(col):
            for tiley in range(row):
                x = tilex * reader.tile_width
                y = tiley * reader.tile_height

                if x >= reader.width or y >= reader.height:
                    continue


                # # For debug
                # fout = open(tilename, "wb")
                # fout.write(contents)
                # fout.close()
                maxlevel = get_max_depth(reader.width, reader.height, reader.tile_width)
                tilename = get_tile_name_slideatlas(tilex,tiley, maxlevel-1)

                print count, level, tilex, tiley, tilename, dry_run

                if dry_run:
                    pass
                else:
                    tile_buffer = StringIO.StringIO()
                    reader_result = reader.dump_tile(x, y, tile_buffer)

                    if reader_result == 0:
                        continue
                    count = count + 1

                    contents = tile_buffer.getvalue()

                    imageobj = { "name" : tilename, "level" : level }
                    imageobj["file"] = Binary(contents)

                    del tile_buffer
                    db[str(imageid)].insert(imageobj)

        logger.warning("Uploaded %d tiles"%(count))


class MongoUploaderWrapper(MongoUploader):
    """
    Class for uploading using image_uploader wrapper
    """
    def __init__(self, args):
        super(MongoUploaderWrapper, self).__init__(args)

    def make_reader(self):
        """
        Creates a ptif reader
        """
        try:
            reader = WrapperReader({"fname" : self.args.input, 'bindir' : self.args.bindir})
            # Introspect
            logger.info("Dimensions: (%d, %d)"%(reader.width, reader.height))
        except:
            logger.error("Fatal Error: Unable to read input file %s"%(self.args.input))
            sys.exit(0)

        return reader


    def load_metadata(self):
        """
        Uses subprocess to get metadata
        """

        # Update image record

        update_image_record(self.reader)

        return imageobj


def make_argument_parser():
    parser = argparse.ArgumentParser(description='Utility to upload images to slide-atlas using BioFormats')

    # Input image
    parser.add_argument("-i", "--input", help='Only ptif images on the file location are supporte das of now', required=True)

    # Where to upload ?
    # The admin database will be already accessible from flaskapp
    # Collection implicitly contains image_store
    parser.add_argument("-c", "--collection", help="Collection id", required=True)
    parser.add_argument("-s", "--session", help="Session id", required=True)
    parser.add_argument("--bindir", help="Path of the image uploader binary", required=False)

    # Optional parameters
    # Tile size if the input image is not already tiled
    parser.add_argument("-t", "--tilesize", help="Tile size in pixes. (power of two recommended). Defaults to tiles in input or 256", default=256, type=int)
    parser.add_argument("-m", "--mongo-collection", help="ObjectId, Destination mongodb collection name. If specified collection is emptied before overwriting")

    # TODO: Support parallel operations
    # parser.add_argument('-j', '--parallel', help='Turn parallel processing ON', action='store_true')

    # Optional flags
    parser.add_argument("-b", "--base-only", help="Upload only base, otherwise uploads all levels in a pyramidal tiff format", default=False, action='store_true')
    parser.add_argument('-n', '--dry-run', help='Entirely removes the session and re-creates', action='store_true')
    parser.add_argument('-v', '--verbose', help='Increases verbosity for each occurence', action='count')

    return parser

# Parse the command line
if __name__ == '__main__':
    """
    Main entry point for image uploader
    Sample commandline is

    ..code-block:: shell-session

        (slideatlas) $python slideatlas/tasks/ptif_upload.py -i ~/data/ptif/20140721T182320-963749.ptif -c 53d0971cdd98b50867b0eecd  -s 53d09798ca7b3a021caff678  -s dj1 -vv -n

    """

    parser = make_argument_parser()
    args = parser.parse_args()

    if args.verbose == None:
        verbose = 0
    else:
        verbose = args.verbose

    if verbose > 1:
        print "Arguments : "
        for akey in vars(args).keys():
            print "   ", akey, ": ", vars(args)[akey]

    if args.input == None:
        print "No input files ! (please use -i <inputfile>"
        sys.exit(255)
    else:
        print "Processing: ", args.input

    # Find the extension of the file
    if args.input.endswith(".ptif"):
        logger.info("Got a PTIF")
        MongoPtifUploader(args)
    elif args.input.endswith(".jp2"):
        logger.info("Got an JPEG2000")
        MongoUploaderWrapper(args)
