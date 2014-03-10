__author__ = 'dhanannjay.deo'

"""
Code to use pylibtiff, a wraper for libtiff 4.03 to extract tiles without
uncompressing them.

On windows requires C:\Python27\Lib\site-packages\libtiff in PATH, on might
require that in LD_LIBRARY_PATH
"""
import sys
from PIL import Image
# Code to debug library loading
#libname = find_library("libtiff")
#print libname
#lib = ctypes.cdll.LoadLibrary(libname)
#print lib

import libtiff as pylibtiff
from libtiff import TIFF
from libtiff.tiff import TIFFfile, TIFFimage
from libtiff.utils import bytes2str

#tif = libtiff.tiff.TIFFfile("c:\\Users\\dhanannjay.deo\\Downloads\\example.tif")
#for atag in tiff.IFD:
from libtiff_ctypes import libtiff
from libtiff_ctypes import TIFF

tif = TIFF.open("c:\\Users\\dhanannjay.deo\\Downloads\\example.tif","r")
#    print atag

#table = tif.GetField("JPEGTables", count=2)
#table = tif.GetField("colormap")
#print table
#sys.exit(0)
import numpy as np
import ctypes

from ctypes import  create_string_buffer
import logging

class TileReader():
    def __init__(self):
        self.jpegtable_size = ctypes.c_uint16()
        self.buf = ctypes.c_voidp()
        self.jpegtables = None


    def _read_JPEG_tables(self):
        """
        """
        libtiff.TIFFGetField.argtypes = libtiff.TIFFGetField.argtypes[:2] + [ctypes.POINTER(ctypes.c_uint16), ctypes.POINTER(ctypes.c_void_p)]
        r = libtiff.TIFFGetField(tif, 347, self.jpegtable_size, ctypes.byref(self.buf))
        assert(r==1)
        self.jpegtables = ctypes.cast(self.buf, ctypes.POINTER(ctypes.c_ubyte))
        logging.log(logging.INFO, "Size of jpegtables: %d"%(self.jpegtable_size.value))

    def set_input_params(self, params):
        """
        The source specific input parameters
        right now just a pointer to the file
        """

        self.tif = TIFF.open(params["fname"], "r")
        self.params = params
        self._read_JPEG_tables()

    def get_tile_from_number(self, tileno, fp):
        """
        This function does something.

        :param tileno: number of tile to fetch
        :param fp: file pointer to which tile data is written
        :returns:  int -- the return code.
        :raises: AttributeError, KeyError
        """
        # Getting a single tile
        tile_size = libtiff.TIFFTileSize(tif, tileno)

        print "TileSize: ", tile_size.value

        tmp_tile = create_string_buffer(tile_size.value)

        r2 = libtiff.TIFFReadRawTile(tif, tileno, tmp_tile, tile_size)
        print "Valid size in tile: ", r2.value
        # Experiment with the file output

        fp.write(ctypes.string_at(self.jpegtables, self.jpegtable_size.value)[:-2])
        # Write padding
        padding = "%c"%(255) * 4
        fp.write(padding)
        fp.write(ctypes.string_at(tmp_tile, r2.value)[2:])

    def dump_tile(self,x,y,fp):
        """
        This function does something.

        :param x: x coordinates of an example pixel in the tile
        :type y: y coordinates of an example pixel in the tile
        :param fp: file pointer to which tile data is written
        :returns:  int -- the return code.
        :raises: AttributeError, KeyError
        """
        # Getting a single tile
        tileno = 27372

        self.get_file_from_number(tileno, fp)

    def update(self):
        """
        Reads width / height etc
        Must be called after the set_input_params is called
        """
        self.tile_width = tif.GetField("TileWidth")
        self.tile_length = tif.GetField("TileLength")

def some():
    #Code to get jpeg tables
    i = open(fname,"rb")
    buf = i.read()
    print "Bytes read: ", len(buf)
    print "Bytes expected: ", jpegtable_size.value + r2.value - 4

    print ':'.join("%02X" % ord(buf[i])for i in range(len(buf)))
    i.close()

    img = Image.open(fname)
    sys.exit(0)

    image_width = tif.GetField("ImageWidth")
    image_length = tif.GetField("ImageLength")

    y = 0
    count = 0
    done = 0
    while y < image_length:
        x = 0
        while x < image_width:
            x += tile_width
            r = libtiff.TIFFReadRawTile(tif, count, tmp_tile, tile_width * tile_length * 3)
            count = count + 1
            if r.value > 0:
                done = done + 1
                print count, done, r.value

        y += tile_length

    tif.close()


if __name__ == "__main__":
    tile = TileReader()
    tile.set_input_params({"fname" : "c:\\Users\\dhanannjay.deo\\Downloads\\example.tif"})
    of = open("test.jpg","wb")
    tile.get_tile_from_number(27372, of)
    of.close()

