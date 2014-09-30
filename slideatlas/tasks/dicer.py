__author__ = 'dhan'

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")

from slideatlas.uploader import MongoUploaderPyramid
from slideatlas.models import Session
from slideatlas.api import apiv2

import logging
logger = logging.getLogger("tasks.dicer")

from bson import ObjectId
from bson.objectid import InvalidId

from .common import celeryapp, flaskapp


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
        try:
            file_id = ObjectId(args["input"])
        except InvalidId:
            # logger.error("Raising exception !")
            raise Exception("Input should be a file or an gridfs id in the collection's default imagestore")

        with flaskapp.app_context():
            # Locate the session
            session = Session.objects.get(id=ObjectId(args["session"]))
            logger.info("session: %s" % (session.to_son()))
            datadb, filefs, afile = apiv2.SessionAttachmentItemAPI._fetch_attachment(session, "imagefiles", file_id)

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

        #TODO: Test and enable other files too
        # if ext in ["ptif", ]:
        #     logger.info("Got a PTIF")
        #     MongoUploaderPtiff(args)

        # elif ext in ["jp2", ]:
        #     logger.info("Got a " + args.input)
        #     MongoUploaderWrapper(args)

        if ext in ["scn", "ndpi", "svs", "tif", "jpg", "png", "bif"]:
            logger.info("Got a " + args["input"])
            MongoUploaderPyramid(args)
        else:
            raise Exception("Unsupported file: " + ext)

    logger.info(str(resp))
    return resp
