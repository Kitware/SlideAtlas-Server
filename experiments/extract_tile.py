__author__ = 'dhanannjay.deo'

"""
Code to use pylibtiff, a wraper for libtiff 4.03 to extract tiles without
uncompressing them.

On windows requires C:\Python27\Lib\site-packages\libtiff in PATH, on might
require that in LD_LIBRARY_PATH
"""
import sys
import Image
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


#Code to get jpeg tables
jpegtable_size = ctypes.c_uint16()
buf = ctypes.c_voidp()

libtiff.TIFFGetField.argtypes = libtiff.TIFFGetField.argtypes[:2] + [ctypes.POINTER(ctypes.c_uint16), ctypes.POINTER(ctypes.c_void_p)]
#print libtiff.TIFFGetField.argtypes
r = libtiff.TIFFGetField(tif, 347, jpegtable_size, ctypes.byref(buf))
jpegtables = ctypes.cast(buf, ctypes.POINTER(ctypes.c_ubyte))

assert(r == 1)
print "Size of jpegtables: ", jpegtable_size.value

#print size.value, repr(buf2)
# To print
#print ':'.join("%02X"%buf2[i] for i in range(size.value))

tile_width = tif.GetField("TileWidth")
tile_length = tif.GetField("TileLength")

# Getting a single tile
tileno = 27372

tile_size = libtiff.TIFFTileSize(tif, tileno)

print "TileSize: ", tile_size.value

tmp_tile = create_string_buffer(tile_size.value)

r2 = libtiff.TIFFReadRawTile(tif, tileno, tmp_tile, tile_size)
print "Valid size in tile: ", r2.value
# Experiment with the file output
fname = "output_%d.jpg"%tileno

of = open(fname,"wb")
of.write(jpegtables)
of.write(tmp_tile)
of.close()

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