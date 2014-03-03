__author__ = 'dhanannjay.deo'

"""
Code to use pylibtiff, a wraper for libtiff 4.03 to extract tiles without
uncompressing them.

On windows requires C:\Python27\Lib\site-packages\libtiff in PATH, on might
require that in LD_LIBRARY_PATH
"""

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

image_width = tif.GetField("ImageWidth")
image_length = tif.GetField("ImageLength")
tile_width = tif.GetField("TileWidth")
tile_length = tif.GetField("TileLength")
import numpy as np
import ctypes

tmp_tile = np.zeros(tile_width * tile_length * 3, dtype=np.uint8)
tmp_tile = np.ascontiguousarray(tmp_tile)
y = 0
count = 0
while y < image_length:
    x = 0
    while x < image_width:
        x += tile_width
        print x, y
        print type(tif)
        r = libtiff.TIFFReadRawTile(tif, count, tmp_tile.ctypes.data, tile_width * tile_length * 3)
        count = count + 1
    y += tile_length

tif.close()