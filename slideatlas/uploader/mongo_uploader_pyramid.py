#vim:tabstop=2:softtabstop=2:shiftwidth=2:expandtab
"""
 Decodes the path info and fetches the corresponding tile from pymongo
 Accepts urls in the form of
      server/tile.py/database/collection/filename.jpg:
"""
import pymongo
from bson import Binary
import sys
import os
from PIL import Image
import StringIO
import re
import argparse
from . import MongoUploader
import pdb

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")

from slideatlas.ptiffstore import OpenslideReader, PilReader
from slideatlas.ptiffstore.common_utils import get_tile_index, get_max_depth

__all__ = ('MongoUploaderPyramid', )

import logging
logger = logging.getLogger("UploaderPyramid")
logger.setLevel(logging.INFO)

from multiprocessing import Process


class TileProcessor(Process):
    def __init__(self, args):
        super(TileProcessor, self).__init__()

        #Initial parameters
        logger.info("ARGS: " + str(args))
        self.args = args
        self.name = self.args["name"]
        self.tilesize = self.args["tilesize"]
        self.white_tile = Image.new('RGB', (self.tilesize, self.tilesize), color=(255, 255, 255))

    def run(self):
        # This executes in another process
        logger.info("Run function executing in: " + str(os.getpid()))

        # Setup the input image
        self.reader = self.make_reader()
        self.max_name_length = get_max_depth(self.reader.width, self.reader.height)

        # Setup the mongo collection to add image chunks to
        self.setup_destination()
        self.process(self.name[:-1], self.name[-1])

    def make_reader(self):
        logger.info(str(self.args))
        ext = os.path.splitext(self.args["input"])[1][1:]
        if ext in ["svs", "ndpi", "scn"]:
            logger.info("%d) Using OpenslideReader for: %s" % (os.getpid(), ext))
            reader = OpenslideReader()
        elif ext in ["jpg", "png"]:
            logger.info("%d) Using PilReader for: %s" % (os.getpid(), ext))
            reader = PilReader()
        else:
            logger.error("Unknown extension: ", ext)
            sys.exit(-1)

        reader.set_input_params({'fname': self.args["input"]})
        logger.info("ImageSize (%d,%d)" % (reader.width, reader.height))
        return reader

    def setup_destination(self):
        try:
            if self.args["imagestore"].replica_set:
                conn = pymongo.ReplicaSetConnection(self.args["imagestore"].host, replicaSet=self.args["imagestore"].replica_set)
            else:
                conn = pymongo.MongoClient(self.args["imagestore"].host)

            self.db = conn[self.args["imagestore"].dbname]
            self.db.authenticate(self.args["imagestore"].username, self.args["imagestore"].password)
            self.col = self.db[str(self.args["imageid"])]
        except Exception as e:
            logger.error("Fatal Error: Unable to connect to imagestore for inserting tiles")
            logger.error("Error: " + e.message)
            sys.exit(-1)

    def process(self, name, toadd):
        """
        The main recursive function to build the image pyramid
        """
        name = name + toadd
        logger.info(str(os.getpid()) + "): getting " + name)

        [startx, starty, zoom] = get_tile_index(name)

        limitx = (startx + 1) * self.args["tilesize"]
        limity = (starty + 1) * self.args["tilesize"]

        if limitx > self.reader.width:
            limitx = self.reader.width

        if limity > self.reader.height:
            limity = self.reader.height

        if len(name) == self.max_name_length:
            # Read from file
            coords = get_tile_index(name)
            logger.info('coords: ' + str(coords))
            startx = coords[0] * self.tilesize
            starty = coords[1] * self.tilesize
            endx = startx + self.tilesize
            endy = starty + self.tilesize

            if endx > self.reader.width:
                endx = self.reader.width

            if endy > self.reader.height:
                endy = self.reader.height

            # verify if within image
            if(startx >= endx or starty >= endy):
                logger.info("Not in image : %d, %d, %d, %d" % (startx, starty, endx - startx, endy - starty))

            else:
                w = endx - startx
                h = endy - starty

                logger.info("Reading from the image: %d, %d, %d, %d" % (startx, starty, w, h))
                bi = self.reader.read_tile(coords[0], coords[1], self.tilesize)
                logger.info("Size of bi " + str(bi.size))
                # Perform padding
                if w < self.tilesize or h < self.tilesize:
                    logger.info("Needs filling ..")

                    # Paste the acquired image into white_tile
                    wi = self.white_tile.copy()
                    logger.info("Pasting at: %s" % [0, self.tilesize-h])
                    wi.paste(bi, (0, self.tilesize-h))

                    # empty bi
                    del bi
                    bi = wi

                # Upload
                self.insert_to_imagestore(name, bi)
                return bi

        # Get parents
        t = self.process(name, 't')
        s = self.process(name, 's')
        r = self.process(name, 'r')
        q = self.process(name, 'q')

        newim = Image.new('RGB', (self.tilesize * 2, self.tilesize * 2), color=None)

        # Combine
        newim.paste(q, (0, 0))
        newim.paste(r, (self.tilesize, 0))
        newim.paste(s, (self.tilesize, self.tilesize))
        newim.paste(t, (0, self.tilesize))

        # Resize
        smallim = newim.resize((self.tilesize, self.tilesize), Image.ANTIALIAS)

        # Upload
        self.insert_to_imagestore(name, smallim)

        del newim
        return smallim

    def insert_to_imagestore(self, name, image_in):

        # Compress
        output = StringIO.StringIO()
        image_in.save(output, format='JPEG')
        contents = output.getvalue()
        output.close()

        # Introspection
        image_in.save(name + ".jpg")

        # Upload
        res_obj = {
            'name':  name + '.jpg',
            'level': len(name),
            'file': Binary(contents)
            }

        self.col.insert(res_obj)


class MongoUploaderPyramid(MongoUploader, Process):
    """
    Uploader class to create image pyramid using python multi-threads
    """
    def __init__(self, args):
        super(MongoUploaderPyramid, self).__init__(args)

    # TODO: could re-imlement but not bothering right now

    def upload_base(self):
        import time
        start = time.clock()

        args = {
            "input": self.args.input,
            "imagestore": self.imagestore,
            "imageid": self.imageid,
            "tilesize": 256
            }

        # processes = []
        # for name in ["tq", "tr", "ts", "tt"]:
        #     args["name"] = name
        #     process = TileProcessor(args)
        #     process.start()
        #     processes.append(process)

        # for process in processes:
        #     process.join()

        args["name"] = "t"
        t = TileProcessor(args)
        t.start()
        t.join()

        print 'Time: ',  time.clock() - start
        print 'Done'

