__author__ = 'dhan'

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")

import slideatlas.uploader as uploader
from slideatlas import models

import logging
logger = logging.getLogger("tasks.dicer")

from bson import ObjectId
from bson.objectid import InvalidId

__all__ = ('process_file', )

from .common import celeryapp


@celeryapp.task()
def process_file(args):
    """
    Deliver the file to appropriate
    """
    resp = {}
    resp["args"] = args
    logger.info("Got task: " + str(args))

    # Try if the input file is a file
    if not os.path.isfile(args["input"]):
        file_is_from_gridfs = True
        try:
            file_id = ObjectId(args["input"])
        except InvalidId:
            # logger.error("Raising exception !")
            raise Exception("Input should be a file or an gridfs id in the collection's default imagestore")

        # Locate the session
        session = models.Session.objects.get(id=ObjectId(args["session"]))
        logger.info("session: %s" % (session.to_son()))
        datadb, filefs, afile = session._fetch_attachment(session, "imagefiles", file_id)

        # Create a temporary location
        temp_folder_name = str(ObjectId())
        logger.info("Using temporary location: " + temp_folder_name)
        newpath = os.path.join(".", temp_folder_name)
        os.makedirs(newpath)

        # Get the file from gridfs
        newinput = os.path.join(newpath, afile.name)
        ofile = open(newinput, "wb")
        ofile.write(afile.read())
        ofile.close()

        args["input"] = newinput

        # Choose the reader based on file extension
        ext = os.path.splitext(args["input"])[1][1:]
        logger.warning("Extension: " + ext)

        if ext in ["scn", "ndpi", "svs", "tif", "jpg", "png", "bif"]:
            logger.info("Got a " + args["input"])
            uploader.MongoUploaderPyramid(args)

        #TODO: Test and enable other files too
        # elif ext in ["ptif", ]:
        #     logger.info("Got a PTIF")
        #     MongoUploaderPtiff(args)

        # elif ext in ["jp2", ]:
        #     logger.info("Got a " + args.input)
        #     MongoUploaderWrapper(args)
        else:
            raise Exception("Unsupported file: " + ext)

    # TODO: Remove the file from gridfs or make it invisible in the queue
    logger.info(str(resp))
    return resp
