__author__ = 'dhanannjay.deo'

"""
Code to use pylibtiff, a wraper for libtiff 4.03 to extract tiles without
uncompressing them.

On windows requires C:\Python27\Lib\site-packages\libtiff in PATH, on might
require that in LD_LIBRARY_PATH
"""

import sys
import svgwrite
from svgwrite import px
import cStringIO as StringIO
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
        self.dir = 0
        self.levels = []

    def select_dir(self, dir):
        """
        :param dir: Number of Directory to select
        """
        if not (len(self.levels) > dir):
            raise Exception("Level not stored in file")
        else:
            pass
            #print "Len: ", len(self.levels), dir
        libtiff.TIFFSetDirectory(self.tif, dir)
        self.dir = libtiff.TIFFCurrentDirectory(self.tif).value
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

    def _compute_levels(self):
        """
        Attempts to compute the dimensions of each resolution by
        """
        self.tile_width = tif.GetField("TileWidth")
        self.tile_height = tif.GetField("TileLength")

        self.levels = {}
        xml = ET.parse("meta.xml")
        for b in xml.findall(".//DataObject[@ObjectType='PixelDataRepresentation']"):
            level = int(b.find(".//*[@Name='PIIM_PIXEL_DATA_REPRESENTATION_NUMBER']").text)
            columns = int(b.find(".//*[@Name='PIIM_PIXEL_DATA_REPRESENTATION_COLUMNS']").text)
            rows = int(b.find(".//*[@Name='PIIM_PIXEL_DATA_REPRESENTATION_ROWS']").text)
            self.levels[level] = [columns, rows]

    def set_input_params(self, params):
        """
        The source specific input parameters
        right now just a pointer to the file
        """

        self.tif = TIFF.open(params["fname"], "r")
        self.params = params
        self._read_JPEG_tables()
        self._compute_levels()

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

        #print "TileSize: ", tile_size.value

        tmp_tile = create_string_buffer(tile_size.value)

        r2 = libtiff.TIFFReadRawTile(tif, tileno, tmp_tile, tile_size)
        #print "Valid size in tile: ", r2.value
        # Experiment with the file output

        fp.write(ctypes.string_at(self.jpegtables, self.jpegtable_size.value)[:-2])
        # Write padding
        padding = "%c"%(255) * 4
        fp.write(padding)
        fp.write(ctypes.string_at(tmp_tile, r2.value)[2:])
        return r2.value

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
        tileno = self.tile_number(x,y)
        if tileno < 0:
            return 0
        else:
            return self.get_tile_from_number(tileno, fp)

    def update_image_info(self):
        """
        Reads width / height etc
        Must be called after the set_input_params is called
        """

        # Grab the image dimensions through the metadata
        self.width = self.levels[self.dir][0]
        self.height = self.levels[self.dir][1]

        #xml = ET.fromstring(tif.GetField("ImageDescription"))
        #self.image_width = int(xml.find(".//*[@Name='PIM_DP_IMAGE_COLUMNS']").text)
        #self.image_height = int(xml.find(".//*[@Name='PIM_DP_IMAGE_ROWS']").text)

        #self.image_width = tif.GetField("ImageWidth")
        #self.image_length = tif.GetField("ImageLength")
        #print tif.GetField("ImageDescription")

def write_svg(scale=100.0):
    tile = TileReader()
    tile.set_input_params({"fname" : "c:\\Users\\dhanannjay.deo\\Downloads\\example.tif"})


    for dir in [0,1,2,3,4]:
        tile.select_dir(dir)
        print "Reading level: ", dir

        image_length = tile.height
        image_width = tile.width
        tile_length = tile.tile_height
        tile_width = tile.tile_width

        dwg = svgwrite.Drawing(filename="test_%d.svg"%(dir), size=(image_width / scale,image_length/scale), debug=True)

        print "Selected Dir: ", dir, "Actual: ", tile.dir
        print "Image: ", image_width, image_length
        #print "Width+Height :", tile_width, tile_length

        count = 0
        done = 0
        y = 5
        while y < image_length:
            x = 5
            while x < image_width:
                #print "Tile number for (%d,%d): "%(x,y), tile_no
                fp = StringIO.StringIO()
                r = tile.dump_tile(x,y,fp)
                count = count + 1
                if r > 0:
                    done = done + 1
                    #print count, done, r
                    color = "purple"
                    dwg.add(dwg.rect(insert=(x/scale*px, y/scale*px), size=(512.0/scale*px, 512.0/scale*px),
                        fill="purple", opacity="0.5", stroke='red', stroke_width=1*px))
                    #dwg.add(dwg.circle(center=(x/scale*px, y/scale*px), r=(2*px), stroke='red', stroke_width=2*px))
                else:
                    pass
                #dwg.add(dwg.rect(insert=(x/10.0*px, y/10.*px), size=(512./10*px, 512.0/10*px),
                #    fill="purple", opacity="0.5", stroke='red', stroke_width=1*px))
                x += tile_width

            y += tile_length
        dwg.save()
        print "Done .."
    tif.close()


def list_tiles(dir):

    tile = TileReader()
    tile.set_input_params({"fname" : "c:\\Users\\dhanannjay.deo\\Downloads\\example.tif"})
    tile.select_dir(dir)

    image_length = tile.height
    image_width = tile.width
    tile_length = tile.tile_height
    tile_width = tile.tile_width

    print "Selected Dir: ", dir, "Actual: ", tile.dir
    print "Image: ", image_width, image_length
    print "Width+Height :", tile_width, tile_length


def extract_tile():
    tile = TileReader()
    tile.set_input_params({"fname" : "c:\\Users\\dhanannjay.deo\\Downloads\\example.tif"})
    of = open("test.jpg","wb")
    tile.get_tile_from_number(27372, of)
    of.close()


if __name__ == "__main__":
    #for i in range(5):
    #    list_tiles(i)

    write_svg()