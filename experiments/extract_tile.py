__author__ = 'dhanannjay.deo'

"""
Code to use pylibtiff, a wraper for libtiff 4.03 to extract tiles without
uncompressing them.

On windows requires C:\Python27\Lib\site-packages\libtiff in PATH, on might
require that in LD_LIBRARY_PATH
"""

import sys

class writer(object):
    log = []

    def write(self, data):
        self.log.append(data)

logger = writer()
#sys.stderr = logger
from xml.etree import cElementTree as ET

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

    def select_dir(self, dir):
        """
        :param dir: Number of Directory to select
        """
        libtiff.TIFFSetDirectory(self.tif, dir)
        self.dir = libtiff.TIFFCurrentDirectory(self.tif)
        #libtiff.TIFFReadDirectory(self.tif)
        self.update_image_info()

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

    def tile_number(self,x,y):
        """
        Returns tile number from current directory

        :param x: x coordinates of an example pixel in the tile
        :type y: y coordinates of an example pixel in the tile
        :returns:  int -- the return code.
        """

        if libtiff.TIFFCheckTile(self.tif, x, y,0,0) == 0:
            return -1
        else:
            return libtiff.TIFFComputeTile(self.tif, x, y,0,0).value

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

    def update_image_info(self):
        """
        Reads width / height etc
        Must be called after the set_input_params is called
        """
        self.tile_width = tif.GetField("TileWidth")
        self.tile_length = tif.GetField("TileLength")
        xml = ET.fromstring(tif.GetField("ImageDescription"))
        self.image_width = int(xml.find(".//*[@Name='PIM_DP_IMAGE_COLUMNS']").text)
        self.image_height = int(xml.find(".//*[@Name='PIM_DP_IMAGE_ROWS']").text)

        #self.image_width = tif.GetField("ImageWidth")
        #self.image_length = tif.GetField("ImageLength")
        #print tif.GetField("ImageDescription")



def list_tiles(dir):
    tile = TileReader()
    tile.set_input_params({"fname" : "c:\\Users\\dhanannjay.deo\\Downloads\\example.tif"})
    print "HERE"
    tile.select_dir(dir)

    image_length = tile.image_height
    image_width = tile.image_width
    tile_length = tile.tile_length
    tile_width = tile.tile_width

    print "Selected Dir: ", dir, "Actual: ", tile.dir.value
    print "Image: ", image_width, image_length
    print "Width+Height :", tile_width, tile_length

    #print ':'.join("%02X" % ord(buf[i])for i in range(len(buf)))
    return
    y = 0
    count = 0
    done = 0
    while y < image_length:
        x = 0
        while x < image_width:
            tile_no = tile.tile_number(x,y)
            x += tile_width

            print "Tile number for (%d,%d): "%(x,y), tile_no

            #r = tile.tile()
            #count = count + 1
            #if r.value > 0:
            #    done = done + 1
            #    print count, done, r.value

        y += tile_length

    tif.close()

def extract_tile():
    tile = TileReader()
    tile.set_input_params({"fname" : "c:\\Users\\dhanannjay.deo\\Downloads\\example.tif"})
    of = open("test.jpg","wb")
    tile.get_tile_from_number(27372, of)
    of.close()


if __name__ == "__main__":
    list_tiles(1)
    list_tiles(2)
    list_tiles(3)
    list_tiles(4)
    list_tiles(5)
    list_tiles(6)
    list_tiles(7)
    list_tiles(8)
    list_tiles(9)
    list_tiles(10)
    list_tiles(11)
    list_tiles(12)
    list_tiles(13)
    list_tiles(14)
