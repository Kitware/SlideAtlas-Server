"""
Write tiff tiles
Depends on libtiff4.0 and pylibtiff
For large image cutout service
"""

from tiff_reader import TileReader

# import base64
import os

# from xml.etree import cElementTree as ET

from libtiff import TIFF

from libtiff.libtiff_ctypes import libtiff
from libtiff.libtiff_ctypes import c_ttag_t

import ctypes

from cStringIO import StringIO
import math

import logging

logger = logging.getLogger('slideatlas')
logger.setLevel(logging.INFO)


class TileTiffWriter():

    def __init__(self, params):

        self.set_params(params)
        # self.jpegtable_size = ctypes.c_uint16()
        # self.buf = ctypes.c_voidp()
        # self.jpegtables = None
        # self.dir = 0
        # self.levels = {}
        # self.isBigTIFF = False
        # self.barcode = ""

    def close(self):
        self.tif.close()

    def select_dir(self, dir):
        """
        :param dir: Number of Directory to select
        """
        libtiff.TIFFSetDirectory
        libtiff.TIFFSetDirectory(self.tif, dir)
        self.dir = libtiff.TIFFCurrentDirectory(self.tif).value

        # Check if the operation was successful
        if self.dir != dir:
            raise Exception("Level not stored in file")

        # self.update_dir_info()

    def _read_JPEG_tables(self):
        """
        """
        libtiff.TIFFGetField.argtypes = libtiff.TIFFGetField.argtypes[
            :2] + [ctypes.POINTER(ctypes.c_uint16), ctypes.POINTER(ctypes.c_void_p)]
        r = libtiff.TIFFGetField(
            self.tif, 347, self.jpegtable_size, ctypes.byref(self.buf))
        assert(r == 1)
        self.jpegtables = ctypes.cast(self.buf, ctypes.POINTER(ctypes.c_ubyte))

        # logger.debug('Size of jpegtables: %d', self.jpegtable_size.value)

        libtiff.TIFFGetField.argtypes = [TIFF, c_ttag_t, ctypes.c_void_p]

    def write_tile(self, tile_no, tile):
        """
        Writes
        """
        pass

    def get_embedded_image(self, imagetype):
        """

        """
        return self.embedded_images[imagetype]

    def set_params(self, params):
        """
        The source specific parameters
        right now just a pointer to the file

        Assumes that the file is opened for writing

        - fname
        - width / height
        """
        self.params = params

        # Initialize the file for writing
        self.tif = TIFF.open(params["fname"], "w")
        self.name = os.path.basename(self.params["fname"])

    def write_tile_by_number(self, tileno, buf):
        """
        This function does something.

        :param tileno: number of tile to fetch
        :param fp: file pointer to which tile data is written
        :returns:  int -- the return code.
        :raises: AttributeError, KeyError
        """
        # Getting a single tile
        # buf.seek(os.SEEK_END)
        # tile_size = buf.tell()
        # buf.seek(os.SEEK_SET)
        # print len(contents)
        ret = libtiff.TIFFWriteRawTile(
            self.tif, tileno, buf, len(buf))
        if ret == -1:
            raise Exception("Tile write failed")

    def tile_number(self, x, y):
        """
        Returns tile number from current directory

        :param x: x coordinates of an example pixel in the tile
        :type y: y coordinates of an example pixel in the tile
        :returns:  int -- the return code.
        """

        if libtiff.TIFFCheckTile(self.tif, x, y, 0, 0) == 0:
            return -1
        else:
            tileno = libtiff.TIFFComputeTile(self.tif, x, y, 0, 0)
            if isinstance(tileno, (int, long)):
                return tileno

            return tileno.value

    def dump_tile(self, x, y, fp):
        """
        This function does something.

        :param x: x coordinates of an example pixel in the tile
        :type y: y coordinates of an example pixel in the tile
        :param fp: file pointer to which tile data is written
        :returns:  int -- the return code.
        :raises: AttributeError, KeyError
        """
        # Getting a single tile
        tileno = self.tile_number(x, y)
        if tileno < 0:
            return 0
        else:
            return self.get_tile_from_number(tileno, fp)

    def set_dir_info(self, width, height):
        """
        Inserts tags for width and height height etc
        Must be called after the set_input_params is called
        """
        # Image dimensions
        self.width = width
        self.height = height

        self.tif.SetField("ImageWidth", self.width)
        self.tif.SetField("ImageLength", self.height)

        # Image tile information
        self.tif.SetField("TileWidth", 256)
        self.tif.SetField("TileLength", 256)

        # Important for interpreting jpeg data
        self.tif.SetField("SAMPLESPERPIXEL", 3)
        self.tif.SetField("BITSPERSAMPLE", 8)

        self.tif.SetField("PLANARCONFIG", 1)
        self.tif.SetField("PHOTOMETRIC", 6)
        self.tif.SetField('COMPRESSION', 7)

        # Grab the image dimensions through the metadata
        self.num_tiles = libtiff.TIFFNumberOfTiles(self.tif)
        if not isinstance(self.num_tiles, (int, long)):
            self.num_tiles = self.num_tiles.value

        # self._read_JPEG_tables()


def test_cutout_from_slideatlas():
    """
    Initial code to create a tiff from slideatlas image
    """

    # TODO: this will involve deducing the end imagestore and asking the image

    # Start with default parameters from slideatlas view
    # https://slide-atlas.org/webgl-viewer?edit=true&db=53468ebc0a3ee10dd6b81ca5&view=54f9c031a7a1410a3162cab9

    input_file = "/media/dhan/storage/data/slideatlas/mutter/20150306T094516-366949.ptif"

    # x1, x2, y1, y2
    bounds = [26438.993700809086, 28596.542380312272,
              44066.05077048139, 46073.218515885615]

    bounds = [int(coord) for coord in bounds]

    # for the tiles
    reader = TileReader()
    reader.set_input_params({"fname": input_file})
    tilesize = reader.tile_width
    # logger.info("TileSize: %d" % tilesize)

    # Test for tiles listed correctly
    # tilesize = 5
    # bounds = [0, 4, 25, 32] # tiles = [(0, 5), (0, 6)], for tilesize = 5
    # bounds = [0, 9, 9, 10] # tiles = [(0, 1), (0, 2), (1, 1), (1, 2)], for tilesize = 5

    # Round the bounds off to nearest tile boundaries
    tile_bounds = [int(math.floor(bounds[0] / tilesize)),
                   int(math.ceil(bounds[1] / tilesize)),
                   int(math.floor(bounds[2] / tilesize)),
                   int(math.ceil(bounds[3] / tilesize))
                   ]

    # logger.info("Bounds: %s" % bounds)
    # logger.info("Tile Bounds: %s" % tile_bounds)

    tile_cols = tile_bounds[1] - tile_bounds[0] + 1
    tile_rows = tile_bounds[3] - tile_bounds[2] + 1

    # Create width and height in the writer
    writer = TileTiffWriter({"fname": "output.tif"})
    writer.set_dir_info((tile_cols) * tilesize,  # width
                        (tile_rows) * tilesize   # height
                        )

    tiles = [(x + tile_bounds[0], y + tile_bounds[2]) for x in range(tile_cols) for y in range(tile_rows)]

    origin_x = tile_bounds[0] * tilesize
    origin_y = tile_bounds[2] * tilesize

    # print tiles

    for atile in tiles:
        # Get tile numbers
        x = atile[0]*tilesize
        y = atile[1]*tilesize

        tileno_in = reader.tile_number(x, y)
        tileno_out = writer.tile_number(x-origin_x, y-origin_y)

        # Read a tile
        # It is faster to recreate StringIO than reuse it

        buf = StringIO()
        reader.get_tile_from_number(tileno_in, buf)
        writer.write_tile_by_number(tileno_out, buf)

        if tileno_out < 0:
            logger.error("Tile errored: %s", atile)
            logger.error("TileIN: %d", tileno_in)
            logger.error("TileOUT: %d", tileno_out)

    # Done
    # print "Output Size", writer.width, writer.height
    # print "Tile grid", tile_cols, tile_rows
    # print "Tile Bounds", tile_bounds[0], tile_bounds[2]
    # print "Tiles", len(tiles)


if __name__ == "__main__":
    # test the reader by copying input.tiff
    # test_ptiff_writer()
    logging.basicConfig()
    test_cutout_from_slideatlas()
