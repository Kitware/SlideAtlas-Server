__author__ = 'dhanannjay.deo'

"""
Code to use pylibtiff, a wraper for libtiff 4.03 to extract tiles without
uncompressing them.

On windows requires C:\Python27\Lib\site-packages\libtiff in PATH, on might
require that in LD_LIBRARY_PATH
"""

import base64
import os

from xml.etree import cElementTree as ET

from libtiff import TIFF

from libtiff.libtiff_ctypes import libtiff
from libtiff.libtiff_ctypes import c_ttag_t

import ctypes

from ctypes import create_string_buffer

import logging
logger = logging.getLogger('slideatlas')

from cStringIO import StringIO

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
        #logger.debug('Size of jpegtables: %d', self.jpegtable_size.value)
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
        # buf.seek(os.SEEK_)
        tile_size = buf.tell()
        # buf.seek(os.SEEK_SET)
        print "TileSize: ", tile_size

        ret = libtiff.TIFFWriteRawTile(self.tif, tileno, buf.getvalue(), tile_size)
        print ret.value

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

        self.tif.SetField("PLANARCONFIG", 1);
        self.tif.SetField("PHOTOMETRIC", 6);
        self.tif.SetField('COMPRESSION', 7)



        # Grab the image dimensions through the metadata
        self.num_tiles = libtiff.TIFFNumberOfTiles(self.tif)
        if not isinstance(self.num_tiles, (int, long)):
            self.num_tiles = self.num_tiles.value

        # self._read_JPEG_tables()

def test_ptiff_writer():
    """
    tests the ptiff writer by copying from a ptiff image

    """
    from tiff_reader import TileReader


    writer = TileTiffWriter({"fname" : "test.tif"})
    reader = TileReader()
    reader.set_input_params({"fname" : "input.tiff"})

    # Write information 
    # writer.select_dir(0)
    writer.set_dir_info(reader.width, reader.height)
    print "Reader contains: ", reader.num_tiles
    reader._read_JPEG_tables()
    for tileno in range(reader.num_tiles):

        # Read a tile
        buf = StringIO()
        reader.get_tile_from_number(tileno, buf)
        print "Size: ", buf.tell()

        # TODO: Read only tile data and write Jpegtables separately

        # Write a tile
        writer.write_tile_by_number(tileno, buf)

def cutout():
    pass



if __name__ == "__main__":
    
    # test the reader by copying input.tiff 
    test_ptiff_writer()
