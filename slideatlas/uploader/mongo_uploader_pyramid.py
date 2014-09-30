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
import time
from PIL import Image
import StringIO
from . import MongoUploader

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")

from slideatlas.ptiffstore import PilReader
from slideatlas.ptiffstore.common_utils import get_tile_index, get_max_depth

__all__ = ('MongoUploaderPyramid', )

import logging
logger = logging.getLogger("UploaderPyramid")
logger.setLevel(logging.ERROR)

from multiprocessing import Process


class TileProcessor(Process):
    def __init__(self, args):
        if not isinstance(args, dict):
            args = vars(args)

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
        self.col.ensure_index("name")

    def make_reader(self):
        logger.info(str(self.args))
        ext = os.path.splitext(self.args["input"])[1][1:]
        if ext in ["svs", "ndpi", "scn", "tif", "bif"]:
            logger.info("%d) Using OpenslideReader for: %s" % (os.getpid(), ext))
            from slideatlas.ptiffstore.openslide_reader import OpenslideReader
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

        [x_index, y_index, _] = get_tile_index(name)

        startx = x_index * self.tilesize
        starty = y_index * self.tilesize

        endx = startx + self.tilesize
        endy = starty + self.tilesize

        if endx > self.reader.width:
            endx = self.reader.width

        if endy > self.reader.height:
            endy = self.reader.height

        # verify if within image
        if(startx >= endx or starty >= endy):
            # No need to dig deeper in the image
            logger.info("Not in image : %d, %d, %d, %d" % (startx, starty, endx - startx, endy - starty))
            return self.white_tile.copy()

        # verify whether the tile already exists in the image_store
        if self.args["verify"]:
            image_rec = self.col.find_one({"name": name + ".jpg"}, {"file": 0})
            if image_rec is not None:
                # Exists already
                image_rec = self.col.find_one({"name": name + ".jpg"})
                return Image.open(StringIO.StringIO(image_rec["file"]))

        if len(name) == self.max_name_length:
            # Read from file
            w = endx - startx
            h = endy - starty

            logger.info("Reading from the image: %d, %d, %d, %d" % (startx, starty, w, h))
            bi = self.reader.read_tile(x_index, y_index, self.tilesize)

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
        # image_in.save(name + ".jpg")

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

    def upload_base(self):
        start = time.time()

        # Parameters for the TileProcessor
        args = {
            "input": self.args["input"],
            "imagestore": self.imagestore,
            "imageid": self.imageid,
            "tilesize": 256,
            "verify": False
            }

        #Create the names for 3rd level from the top
        names = []
        quads = ["q", "r", "s", "t"]
        for letter1 in quads:
            for letter2 in quads:
                    names.append("t%c%c" % (letter1, letter2))

        # Launch the tasks and wait for them to finish
        processes = []
        for name in names:
            args["name"] = name
            process = TileProcessor(args)
            process.start()
            processes.append(process)

        for process in processes:
            process.join()

        args["name"] = "t"
        args["verify"] = True
        t = TileProcessor(args)
        t.start()
        t.join()

        logger.error('Time: %f' % (time.time() - start))
        print 'Done'
