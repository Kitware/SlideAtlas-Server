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

debug = False
tilesize = 256
force = 0
level = 0
total = 0

max_levels = 8
from multiprocessing import Process


class TileProcessor(Process):
    def __init__(self, args):
        super(TileProcessor, self).__init__()

        #Initial parameters
        logger.info("ARGS: " + str(args))
        self.args = args
        self.name = self.args["name"]
        self.white_tile = Image.new('RGB', (tilesize, tilesize), color=(255, 255, 255))

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

        [a, startx, starty] = get_tile_index(name)

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
            startx = coords[1] * tilesize
            starty = coords[2] * tilesize
            endx = startx + tilesize
            endy = starty + tilesize

            if endx > self.reader.width:
                endx = self.width

            if endy > self.reader.height:
                endy = self.reader.height

            # verify if within image
            if(startx >= endx or starty >= endy):
                logger.info("Not in image : %d, %d, %d, %d" % (startx, starty, endx - startx, endy - starty))

            else:
                w = endx - startx
                h = endy - starty

                logger.info("Reading from the image: %d, %d, %d, %d" % (startx, starty, w, h))
                bi = self.reader.read_region((startx, starty), (w, h))

                # Perform padding
                if w < tilesize or h < tilesize:
                    logger.info("Needs filling ..")

                    # Paste the acquired image into white_tile
                    wi = self.white_tile.copy()
                    wi.paste(bi, [0, 0, w, h])

                    # empty bi
                    del bi
                    bi = wi

                # Save it out
                bi.save(name + ".jpg")
                return bi

        # Get parents
        q = self.process(name, 'q')
        r = self.process(name, 'r')
        s = self.process(name, 's')
        t = self.process(name, 't')

        newim = Image.new('RGB', (tilesize * 2, tilesize * 2), color=None)

        # Combine
        newim.paste(q, (0, 0))
        newim.paste(r, (tilesize, 0))
        newim.paste(s, (tilesize, tilesize))
        newim.paste(t, (0, tilesize))

        # Resize
        smallim = newim.resize((tilesize, tilesize), Image.ANTIALIAS)

        # Compress
        output = StringIO.StringIO()
        smallim.save(output, format='JPEG')
        contents = output.getvalue()
        output.close()

        # Upload
        res_obj = {
            'name':  name + '.jpg',
            'level': len(name),
            'file': Binary(contents)
            }

        self.col.insert(res_obj)

        del newim
        return smallim


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

        # Create 4 processes
        tq = TileProcessor({"name": 'tq', "input": self.args.input, "imagestore": self.imagestore, "imageid": self.imageid, "tilesize": 256})
        tq.start()

        tr = TileProcessor({"name": 'tr', "input": self.args.input, "imagestore": self.imagestore, "imageid": self.imageid, "tilesize": 256})
        tr.start()

        ts = TileProcessor({"name": 'ts', "input": self.args.input, "imagestore": self.imagestore, "imageid": self.imageid, "tilesize": 256})
        ts.start()

        tt = TileProcessor({"name": 'tt', "input": self.args.input, "imagestore": self.imagestore, "imageid": self.imageid, "tilesize": 256})
        tt.start()

        tq.join()
        tr.join()
        ts.join()
        tt.join()

        t = TileProcessor({"name": 'tq', "input": self.args.input, "imagestore": self.imagestore, "imageid": self.imageid, "tilesize": 256})
        t.start()
        t.join()

        print 'Time: ',  time.clock() - start
        print 'Done'

