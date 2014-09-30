__author__ = 'dhan'

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")
from slideatlas.uploader import MongoUploaderWrapper, MongoUploaderPtiff, MongoUploaderPyramid

import logging
logger = logging.getLogger("tasks.dicer")

from bson import ObjectId

from .common import celeryapp


@celeryapp.task()
def process_file(args):
    """
    Deliver the file to appropriate
    """
    resp = {}
    resp["args"] = args
    logger.info("Got task: " + str(args))
    # if args.input is None:
    #     # Get the file from
    #     # Create a unique folder name
    #     temp_folder_name = str(ObjectId())
    #     logger.info("Using " + temp_folder_name)

    # ext = os.path.splitext(args.input)[1][1:]
    # logger.warning("Extension: " + ext)

    # if ext in ["ptif", ]:
    #     logger.info("Got a PTIF")
    #     MongoUploaderPtiff(args)

    # elif ext in ["jp2", ]:
    #     logger.info("Got a " + args.input)
    #     MongoUploaderWrapper(args)

    # elif ext in ["scn", "ndpi", "svs", "tif", "jpg", "png", "bif"]:
    #     logger.info("Got a " + args.input)
    #     MongoUploaderPyramid(args)

    # else:
    #     # Check if the input is a dir
    #     logger.error("Unsupported file: " + args.input[-4:])

    logger.info(str(resp))
    return resp
