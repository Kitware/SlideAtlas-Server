# ptif_uploader script / webhook

# The developement has been resumed from uploader_jyhton
# Designed to use models from slide-atlas
__author__ = 'dhan'

import os
from celery import Celery
from celery.task.control import inspect
from celery.result import AsyncResult
import time
import sys
import json
import argparse

import logging

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")
from slideatlas import create_celery_app
from slideatlas  import create_app 
from slideatlas import models
from slideatlas.ptiffstore.tiff_reader import TileReader

from bson import ObjectId
from bson.objectid import InvalidId
import pymongo

# Create teh application objects 
flaskapp = create_app()
celeryapp = create_celery_app(flaskapp)

def mongo_uploader(args, logger):
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
    # Obtain credentials for storing tiles in image store 
    imagestore = None
    
    # If imagestore is  is objectid
    try:
        dbid = ObjectId(args.imagestore)
        imagestore = models.ImageStore.objects.get(id=dbid)
    except InvalidId:
        logger.warning("Invalid ObjectID: %s"%(args.imagestore))
    
    # Try to locate by 
    if not imagestore:
        try:
            imagestore = models.MultipleDatabaseImageStore.objects.get(dbname=args.imagestore)    
        except:
            logger.warning("Image Store with key: %s Not found"%(args.imagestore))

    if imagestore:
        logger.info("Found imagestore \n %s"%(imagestore.to_son()))
    else:
        logger.error("Fatal Error: Image Store %s Not found"%(args.imagestore))
        return -1

    # TODO: Whether the input is a url
    # input is a slideatlas endpoint if "https://slide-atlas.org/api/v2/sessions/53cd6a5c81652c3a70d89976/attachments/53ce8f8fdd98b56dcb926d01"

    try:
        # Now check the input
        reader = TileReader()
        reader.set_input_params({"fname" : args.input })

        # Introspect
        logger.info("Dimensions: (%d, %d)"%(reader.width, reader.height))
        reader.parse_image_description()
        logger.info("Tilesize: %d, NoTiles: %d"%(reader.tile_width, reader.num_tiles))
    except:
        logger.error("Fatal Error: Unable to read input file %s"%(args.input))
        return -1

    fname = os.path.split(args.input)[1]
    imageid = ObjectId()
    logger.info("Using New ImageID: %s"%(imageid))

    # Create image record
    with flaskapp.app_context():
        with imagestore:
            image_doc = models.Image()
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
            image_doc.validate()
            print "Printing image doc"
            print image_doc
            image_doc.save()


    # Upload the base
    try:
        if imagestore.replica_set:
            conn = pymongo.ReplicaSetConnection(imagestore.host, replicaSet=imagestore.replica_set)
            db = conn[imagestore.dbname]
            db.authenticate(imagestore.username, imagestore.password)
            print db["images"].find_one()
    except:
        logger.error("Fatal Error: Unable to connect to imagestore for inserting tiles")
        return -1

# Parse the command line
if __name__ == '__main__':
    """
    Main entry point for image uploader (should be common to all uploader wrappers)
    Does read and dice image and uploads to a collection, and does only that.
    """

    parser = argparse.ArgumentParser(description='Utility to upload images to slide-atlas using BioFormats')
    
    # Input image
    parser.add_argument("-i", "--input", help='Input image', required=True)

    # Where to upload ?
    # The admin database will be already accessible from flaskapp

    parser.add_argument("-s", "--imagestore", help="Set database name. Default -d \"mydb\"", default="mydb")
    parser.add_argument("-c", "--collection", help="Collection id", required=True)

    # Optional parameters 
    # Tile size if the input image is not already tiled 
    parser.add_argument("-t", "--tilesize", help="Tile size in pixes. (power of two recommended). Defaults to tiles in input or -t 256", default=256, type=int)
    parser.add_argument("-m", "--mongo-collection", help="Set collection name. A new one is generated if not supplied")

    # boolean flags
    parser.add_argument('-f', '--force', help='Entirely removes the image collection and re-creates', action='store_true')
    parser.add_argument('-n', '--dry-run', help='Entirely removes the session and re-creates', action='store_true')
    parser.add_argument('-v', '--verbose', help='Turn verbosity ON', action='count')
    parser.add_argument('-j', '--parallel', help='Turn parallel processing ON', action='store_true')

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

    logging.basicConfig()
    rootLogger = logging.getLogger()
    logger = logging.getLogger("slideatlas.ptif_uploader")
    logger.setLevel(logging.INFO)
    
    mongo_uploader(args, logger)

    # # Try opening the database
    # if verbose > 1:
    #     print "Verifying database connection .."

    # # If opening the database fails, then just bail out
    # conn = MongoClient(args.mongodb)
    # db = conn.getDB(args.database)

    # if len(args.username) > 0:
    #     db.authenticate(args.username, args.password)

    # if verbose > 1:
    #     print "Setting up destination ..",

    # if args.collection_name == None:
    #     # Create one
    #     colname = str(ObjectId().get())
    # else:
    #     colname = args.collection_name

    # if verbose > 1:
    #     print "Collection name: ", colname

    # coll = db.getCollection(colname)

    # if(args.parallel):
    #     tqq = TileProcessor(args.input, 'tqq',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     tqr = TileProcessor(args.input, 'tqr',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     tqs = TileProcessor(args.input, 'tqs',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     tqt = TileProcessor(args.input, 'tqt',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     trq = TileProcessor(args.input, 'trq',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     trr = TileProcessor(args.input, 'trr',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     trs = TileProcessor(args.input, 'trs',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     trt = TileProcessor(args.input, 'trt',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     tsq = TileProcessor(args.input, 'tsq',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     tsr = TileProcessor(args.input, 'tsr',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     tss = TileProcessor(args.input, 'tss',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     tst = TileProcessor(args.input, 'tst',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     ttq = TileProcessor(args.input, 'ttq',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     ttr = TileProcessor(args.input, 'ttr',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     tts = TileProcessor(args.input, 'tts',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)
    #     ttt = TileProcessor(args.input, 'ttt',args.mongodb, args.database, username=args.username,password=args.password, verbose=verbose, collect_name=colname)

    #     tqq.start()
    #     tqr.start()
    #     tqs.start()
    #     tqt.start()
    #     trq.start()
    #     trr.start()
    #     trs.start()
    #     trt.start()
    #     tsq.start()
    #     tsr.start()
    #     tss.start()
    #     tst.start()
    #     ttq.start()
    #     ttr.start()
    #     tts.start()
    #     ttt.start()

    #     tqq.join()
    #     tqr.join()
    #     tqs.join()
    #     tqt.join()
    #     trq.join()
    #     trr.join()
    #     trs.join()
    #     trt.join()
    #     tsq.join()
    #     tsr.join()
    #     tss.join()
    #     tst.join()
    #     ttq.join()
    #     ttr.join()
    #     tts.join()
    #     ttt.join()
    
    # verbose = 0
    # if args.verbose:
    #     print "Ready to process"
    #     verbose = 1
    # # import time
    # start = time.clock()

    # t = TileProcessor(args.input, "t", args.mongodb, args.database, colname, username=args.username,password=args.password, verbose=verbose)
    # t.start()
    # t.join()
    # image_name = t.get_image_name()
    # #
    # if verbose > 1:
    #     print "Uploading to image_name: " , image_name

    # # Make sure that a view is updated in the session
    # colviews = db.getCollection("views")

    # # Locate the session
    # colsession = db.getCollection("sessions")
    # session = colsession.findOne(BasicDBObject("name",  args.session))

    # if verbose > 1:
    #     print "Session obj before creation : ", session

    # if session == None:
    #     # first create a chapter name
    #     if verbose > 0:
    #         print "Creating a session .."
    #     colsession.insert(BasicDBObject("name", args.session))
    #     session = colsession.findOne(BasicDBObject("name", args.session))
    #     colsession.update(BasicDBObject("_id", session.get("_id")), BasicDBObject("$set", BasicDBObject("label", session["name"])))
    #     session = colsession.findOne(BasicDBObject("name", args.session))
    # else:
    #     if verbose > 0:
    #         print "Session already exists, will add images"

    # if verbose > 1:
    #     print "Session as of now: ", session

    # # # Create a view
    # new_view_id = ObjectId()
    # colviews.insert(BasicDBObject("img", ObjectId(image_name)).append("_id", new_view_id))

    # # Get the posision of the new image
    # pos = 0
    # views = BasicDBList()
    # if not "views" in  session.keySet():
    #     if verbose > 1:
    #         print "No views yet"
    # else :
    #     views = session.get('views')
    #     for aview in views:
    #         if aview.get('pos') > pos :
    #             pos = aview.get('pos')
    #             # Increment the new position as we are going to increase the number
    #     pos = pos + 1

    # view_rec = BasicDBObject("pos", pos).append("ref", new_view_id).append("hide",False)
    # if verbose > 1:
    #     print "Type of views: ", type(views)
    # views.add(view_rec)
    # if verbose > 1:
    #     print "Views: ", views

    # # insert the view in session
    # colsession.update(BasicDBObject("_id", session.get("_id")), BasicDBObject("$set", BasicDBObject("views", views)))

    # if verbose > 0:
    #     print 'Done Time: ',  time.clock() - start
