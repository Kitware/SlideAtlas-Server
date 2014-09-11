# ptif_uploader script / webhook

# The developement has been resumed from uploader_jyhton
# Designed to use models from slide-atlas
__author__ = 'dhan'

#TODO: Extend the uploader for
# - Wrapping c++ image_uploader for ndpi and jp2 images

#noqua E501

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
from slideatlas.models import Collection, Session, MultipleDatabaseImageStore, ImageStore, RefItem, Image, NewView

from slideatlas.ptiffstore.base_reader import Reader
from slideatlas.ptiffstore.tiff_reader import TileReader
from slideatlas.ptiffstore.common_utils import get_max_depth, get_tile_name_slideatlas


from bson import ObjectId, Binary
from bson.objectid import InvalidId
import pymongo

# Create teh application objects
flaskapp = create_app()
celeryapp = create_celery_app(flaskapp)


class WrapperReader(Reader):
    def __init__(self, params=None):
        super(WrapperReader, self).__init__(params)

    def set_input_params(self, params):
        """
        Resets the state of the reader to the default using inputs provided
        """
        super(WrapperReader, self).set_input_params(params)

        logger.info("Received following input params: %s" % params)
        fullname = params["fname"]
        name = os.path.basename(fullname)
        self.name = name

        # Perform extension specific operation here
        # TODO: Use the extension to determine the capability
        # extension = os.path.splitext(fullname)

        # params = ["./image_uploader", "-m", "new.slide-atlas.org", "-d",
        #                       istore.dbname, "-n", self.params["fname"]]
        # if len(istore.username) > 0:
        #     params = params + ["-u", istore.username, "-p", istore.password]

        if os.name == 'nt':
            params = [self.params["bindir"] + "image_uploader.exe", "-n", fullname]
        else:
            params = [self.params["bindir"] + "image_uploader", "-n", fullname]
            # params = " ".join(params)

        logger.info("Params: " + str(params))
        # Get the information in json

        try:
            output, erroutput = subprocess.Popen(params, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                                 cwd=self.params["bindir"],
                                                 shell=False).communicate()
        except OSError as e:
            logger.error("Fatal error from OS while executing \
                          image_uploader (possible incorrect --bindir): \
                          %s" % e.message)
            sys.exit(-1)

        logger.error("ErrOutput")
        logger.error(erroutput)
        js = {}
        try:
            js = json.loads(output)
        except:
            logger.error("Fatal error Output of image_uploader \
                not valid json: %s" % output)

            sys.exit(-1)

        logger.info("JS: %s" % js)

        if js.has_key('error'):
            anitem.textStatus.SetLabel("Error")
            logger.error("Fatal error UNREADABLE input:\n%s"%(output))
            sys.exit(-1)

        if not js.has_key("information"):
            logger.error("Fatal error NO INFORMATION")
            sys.exit(-1)

        self.width = js["dimensions"][0]
        self.height = js["dimensions"][1]
        self.num_levels = js["levels"]
        self.origin = js["origin"]
        self.spacing = js["spacing"]
        self.components = js["components"]
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

        """ Id of the image collection to write to. It is not set initially
            but the init process will set it according to input parameter
        """
        self.imageid = None
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
                logger.info("Using specified ImageID: %s" % self.imageid)
            else:
                self.imageid = ObjectId()
                logger.info("Using new ImageID: %s" % self.imageid)

        except InvalidId:
            logger.error("Invalid ObjectID for mongo collection: \
                             %s" % self.args.mongo_collection)

        # Load image store
        self.setup_destination()

        # Check whether image exists already
        if self.check_exists_already():
            logger.info("Image will be skipped")
            return
        else:
            logger.info("Image will be uploaded")

        # Load reader
        self.reader = self.make_reader()

        # Insert image record
        self.insert_metadata()

        # Upload base / level
        self.upload_base()

        # build pyramid
        self.update_collection()

        # Done !
    def update_collection(self):
        """
        Update the collection

        i.e. Create a view, add the view to the session
        expects imagestore and db to be setup
        """

        if self.args.dry_run:
            logger.info("Dry run .. not updating collection record")
            return

        # Update the session
        with flaskapp.app_context():
            # Create and insert view
            aview = NewView(image=ObjectId(self.imageid), db=self.imagestore.id)
            aview.save()

            item = RefItem(ref=aview.id, db=self.imagestore.id)
            self.session.views.append(item)
            self.session.save()

    def make_reader(self):
        """
        Will not be implemented in the base uploader class
        """
        logging.error("make_reader NOT implemented")
        sys.exit(-1)

    def upload_base(self):
        """
        Will not be implemented in the base uploader class
        """
        logging.error("upload_base is NOT implemented")
        sys.exit(-1)

    def setup_destination(self):
        """
            Get the destination session in the collection
        """
        with flaskapp.app_context():
            # Locate the session

            self.coll = Collection.objects.get(id=ObjectId(self.args.collection))
            logger.info("collection: %s"%(self.coll.to_son()))

            self.imagestore = self.coll.image_store
            logger.info("imagestore: %s"%(self.imagestore.to_son()))

            self.session = Session.objects.get(id=ObjectId(self.args.session))
            logger.info("session: %s"%(self.session.to_son()))


        # Create the pymongo connection, used for image
        # For view use NewView
        try:
            if self.imagestore.replica_set:
                conn = pymongo.ReplicaSetConnection(self.imagestore.host, replicaSet=self.imagestore.replica_set)
            else:
                conn = pymongo.MongoClient(self.imagestore.host)

            self.db = conn[self.imagestore.dbname]
            self.db.authenticate(self.imagestore.username, self.imagestore.password)
        except:
            logger.error("Fatal Error: Unable to connect to imagestore for inserting tiles")
            sys.exit(-1)

    def check_exists_already(self):
        """
        Verifies if the destination image appears to be in the images session
        """
        image_name = os.path.split(self.args.input)[1]

        image_doc = self.db["images"].find_one({"filename" : image_name})

        if image_doc is not None:
            logger.info("Image exists already")
            return True

        else:
            return False

    def insert_metadata(self):
        """
        Inserts the created image metadata object if the flags permit
        and connection established

        Expects self.imagestore and self.reader to be set
        """

        if self.imagestore == None:
            logger.error("Fatal Error: Imagestore not set")
            sys.exit(-1)

        with flaskapp.app_context():
            with self.imagestore:
                # For now use pymongo
                image_doc = {}
                image_doc["filename"]= self.reader.name
                image_doc["label"]= self.reader.name
                image_doc["origin"] = self.reader.origin
                image_doc["spacing"] = self.reader.spacing
                image_doc["dimensions"] =[self.reader.width, self.reader.height]
                image_doc["levels"] = self.reader.num_levels
                image_doc["components"] = self.reader.components
                image_doc["metadataready"] = True
                image_doc["_id"] = self.imageid

                if self.args.dry_run:
                    logger.info("Dry run .. not creating image record: %s"%(image_doc))
                else:
                    self.db["images"].insert(image_doc)



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
        logger.error("Fatal error this implementation NEEDS A REVIEW, TODO: Use methods from base class ")
        sys.exit(-1)
        fname = os.path.split(self.args.input)[1]

        # Get the destination session in the collection
        # try:
        self
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
                image_doc["filename"] = fname
                image_doc["label"] = fname
                image_doc["origin"] = [0, 0, 0]
                image_doc["spacing"] = [1.0, 1.0, 1.0]  # TODO: Get it from the data
                image_doc["dimensions"] = [reader.width, reader.height]
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
        reader = WrapperReader({"fname" : self.args.input, 'bindir' : self.args.bindir})

        try:
            reader = WrapperReader({"fname" : self.args.input, 'bindir' : self.args.bindir})
            # Introspect
            logger.info("Dimensions: (%d, %d)"%(reader.width, reader.height))
        except:
            logger.error("Fatal Error: Unable to read input file %s"%(self.args.input))
            sys.exit(0)

        return reader

    def upload_base(self):
        """
        Does not depend on the reader, instead wraps the image_uploader utility
        Expects the reader and the imagestore to be setup before
        """

        if self.args.dry_run:
            logger.info("Dry run .. not uploading base")
            return

        istore = self.imagestore

        if os.name == 'nt':
            args = [self.args.bindir + "image_uploader.exe", "-m", istore.host.split(",")[0], "-d", istore.dbname, "-c", str(self.imageid), self.args.input]
            if len(istore.username) > 0:
                args = args + ["-u", istore.username, "-p", istore.password]
        else:
            args = [self.args.bindir + "/image_uploader", "-m", istore.host.split(",")[0], "-d", istore.dbname, "-c", str(self.imageid), self.args.input]
            if len(istore.username) > 0:
                args = args + ["-u", istore.username, "-p", istore.password]

            # args = " ".join(args)

        logger.info("Params: " + str(args))
        # Get the information in json

        proc = subprocess.Popen(args, stdout=subprocess.PIPE, cwd=self.args.bindir, shell=False)

        while True:
            time.sleep(0)

            result = proc.poll()

            if not (result is None):
                # Process died
                if not result == 0:
                    logger.error("Fatal error: Process died without any output")
                    sys.exit(1)

            output = proc.stdout.readline()
            #print output

            try:
                js = json.loads(output)
            except:
                logger.error("Fatal error: Invalid json output from image_uploader:\n%s" % output)
                sys.exit(1)

            if "error" in js:
                logger.error("Fatal error: image_uploader says:%s" % js["error"])
                sys.exit(1)

            if "information" in js:
                logger.info("Information available")

            if "progress_percent" in js:
                logger.info("Progress : %f" % js['progress_percent'])

            if "success" in js:
                logger.info("DONE !!")
                break


def process_zip(args):
    """
    TODO: Extract files and call process_dir
    """

    # Extracts zip
    zname = args.input
    assert zname.endswith("zip")
    session_name = os.path.splitext(os.path.basename(zname))[0]
    logger.info("Session name wil be: " + session_name)
    # Creates the session

    # Get collection
    with flaskapp.app_context():
        # Locate the session
        try:
            coll = Collection.objects.get(id=ObjectId(args.collection))
            logger.info("collection: %s" % coll.to_son())

            session = Session(collection=coll, image_store=coll.image_store, label=session_name)
            logger.info("Creating session: " + str(session.to_json()))
            session.save()
        except Exception as e:
            logger.error("Fatal Error while creating session: " + e.message)

            sys.exit(-1)

    args.session = str(session.id)

    temp = ObjectId()

    import zipfile

    fh = open(zname,  'rb')
    z = zipfile.ZipFile(fh)
    for name in z.namelist():
        logger.info("Extracting .." + name)
        outpath = str(temp)
        z.extract(name, outpath)

    fh.close()
    # In a loop calls the corresponding files

    import glob
    for afile in glob.glob(str(temp) + "/*"):
        logger.info("Processing inside of: " + afile)
        args.input =  os.path.abspath(afile)
        MongoUploaderWrapper(args)

    # Remove the folder
    # import shutil
    # shutil.rmtree(str(temp))

def process_dir(args):
    """
    processes dir
    """
    # Extracts zip
    dir_name = args.input
    session_name = os.path.split(dir_name)[1]
    logger.info("Session name wil be: " + session_name)
    # Creates the session

    # Get collection
    with flaskapp.app_context():
        # Locate the session
        try:
            coll = Collection.objects.get(id=ObjectId(args.collection))
            logger.info("collection: %s" % coll.to_son())

        except Exception as e:
            logger.error("Fatal: Collection not found: " + e.message)
            sys.exit(-1)

        try:

            session = Session.objects.get(label=session_name)

        except Exception as e:
            logger.info("No session:" + e.message)
            session = None

        if session is None:
            logger.info("Session will be created")
            try:
                logger.info("Creating session: " + session_name)
                session = Session(collection=coll, image_store=coll.image_store, label=session_name)
                session.save()

            except Exception as e:
                logger.error("Fatal: Could not create session: " + e.message)
                sys.exit(-1)
        else:
            logger.info("Session Exists")

    args.session = str(session.id)

    import glob
    for afile in glob.glob(str(dir_name) + "/*"):
        logger.info("Processing inside of: " + afile)
        args.input =  os.path.abspath(afile)
        process_file(args)

def process_file(args):
    """
    Deliver the file to appropriate
    """
    if args.input.endswith(".ptif"):
        logger.info("Got a PTIF")
        MongoPtifUploader(args)
    elif args.input.endswith(".jp2") or args.input.endswith(".jpg") or args.input.endswith(".ndpi") or args.input.endswith(".tif"):
        logger.info("Got a " + args.input)
        MongoUploaderWrapper(args)
    else:
        # Check if the input is a dir
        logger.error("Unsupported file: " + args.input[-4:])

def make_argument_parser():
    parser = argparse.ArgumentParser(description='Utility to upload images to slide-atlas using BioFormats')

    # Input image
    parser.add_argument("-i", "--input", help='Only ptif images on the file location are supporte das of now', required=True)

    # Where to upload ?
    # The admin database will be already accessible from flaskapp
    # Collection implicitly contains image_store
    parser.add_argument("-c", "--collection", help="Collection id", required=True)

    parser.add_argument("-s", "--session", help="Required for non-zip files", required=False)
    parser.add_argument("--bindir", help="Path of the image uploader binary", required=False, default="./")

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
    Uploads a single image

        ..code-block:: shell-session

        (slideatlas) $python slideatlas/tasks/ptif_upload.py -i ~/data/ptif/20140721T182320-963749.ptif -c 53d0971cdd98b50867b0eecd  -s 53d09798ca7b3a021caff678  -s dj1 -vv -n

    """

    parser = make_argument_parser()
    args = parser.parse_args()

    if args.verbose is None:
        verbose = 0
    else:
        verbose = args.verbose

    if verbose > 1:
        print "Arguments : "
        for akey in vars(args).keys():
            print "   ", akey, ": ", vars(args)[akey]

    if args.input is None:
        print "No input files ! (please use -i <inputfile>"
        sys.exit(-1)
    else:
        logger.info("Processing: %s" % args.input)

    # Find the extension of the file
    if args.input.endswith(".zip"):
        logger.info("Got a " + args.input[-4:])
        process_zip(args)
    elif os.path.isdir(args.input):
        logger.info("Got a DIR !!")
        logger.info("Got: " + args.input)
        process_dir(args)
    else:
        if args.session is None:
            logger.error("Fatal: Session required for non-zip input")
            sys.exit(-1)

        process_file(args)
