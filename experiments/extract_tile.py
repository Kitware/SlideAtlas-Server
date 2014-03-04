__author__ = 'dhanannjay.deo'

"""
Code to use pylibtiff, a wraper for libtiff 4.03 to extract tiles without
uncompressing them.

On windows requires C:\Python27\Lib\site-packages\libtiff in PATH, on might
require that in LD_LIBRARY_PATH
"""
import sys
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

buf = create_string_buffer("\000" * 100000)

size = ctypes.c_uint16()

libtiff.TIFFGetField.argtypes = libtiff.TIFFGetField.argtypes[:2] + [ctypes.POINTER(ctypes.c_uint16), ctypes.POINTER(ctypes.c_void_p)]
print libtiff.TIFFGetField.argtypes
r = libtiff.TIFFGetField(tif, 347, ctypes.byref(size), ctypes.byref(ctypes.cast(buf, ctypes.c_void_p)))
print size.value, repr(buf.raw)
#for i in range(size.value):
#    print i

print r
sys.exit(0)

image_width = tif.GetField("ImageWidth")
image_length = tif.GetField("ImageLength")
tile_width = tif.GetField("TileWidth")
tile_length = tif.GetField("TileLength")

tmp_tile = np.zeros(tile_width * tile_length * 3, dtype=np.uint8)
tmp_tile = np.ascontiguousarray(tmp_tile)
y = 0
count = 0
done = 0
while y < image_length:
    x = 0
    while x < image_width:
        x += tile_width
        r = libtiff.TIFFReadRawTile(tif, count, tmp_tile.ctypes.data, tile_width * tile_length * 3)
        count = count + 1
        if r.value > 0:
            done = done + 1
            print done, r.value

    y += tile_length

tif.close()