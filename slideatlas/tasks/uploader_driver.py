# ptif_uploader script / webhook

# The developement has been resumed from uploader_jyhton
# Designed to use models from slide-atlas
__author__ = 'dhan'

#TODO: Extend the uploader for
# - Wrapping c++ image_uploader for ndpi and jp2 images

#noqua E501

import os
import sys
import argparse

# from celery import Celery
# from celery.task.control import inspect
# from celery.result import AsyncResult
# import time
# import sys
# import json
# import cStringIO as StringIO
# from math import floor
# import subprocess

import logging
logging.basicConfig()
rootLogger = logging.getLogger()
logger = logging.getLogger("uploader_driver")
logger.setLevel(logging.INFO)

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")
# from slideatlas import create_celery_app
from slideatlas import create_app
from slideatlas.models import Collection, Session

# from slideatlas.ptiffstore.tiff_reader import TileReader
# from slideatlas.ptiffstore.common_utils import get_max_depth, get_tile_name_slideatlas

from slideatlas.uploader import MongoUploaderWrapper, MongoUploaderPtiff, MongoUploaderPyramid

from bson import ObjectId
# import pymongo

# Create the application objects
# celeryapp = create_celery_app(flaskapp)


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

    # Create app context locally
    flaskapp = create_app()
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
        args.input = os.path.abspath(afile)
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

    flaskapp = create_app()
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
        args.input = os.path.abspath(afile)
        process_file(args)


def process_file(args):
    """
    Deliver the file to appropriate
    """
    if args.input.endswith(".ptif"):
        logger.info("Got a PTIF")
        MongoUploaderPtiff(args)

    elif args.input.endswith(".jp2") or args.input.endswith(".ndpi") or args.input.endswith(".tif"):
        logger.info("Got a " + args.input)
        MongoUploaderWrapper(args)

    elif args.input.endswith(".jpg"):
        logger.info("Got a " + args.input)
        MongoUploaderPyramid(args)

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
