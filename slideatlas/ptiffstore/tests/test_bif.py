# test_bif.py
import os
import sys

tplpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../tpl"))

if os.name == 'nt':
    pylibtiffpath = os.path.join(tplpath, "pylibtiff-read-only",
                                 "build", "lib.win-amd64-2.7")
else:
    pylibtiffpath = os.path.join(tplpath, "pylibtiff-read-only",
                                 "build", "lib.linux-x86_64-2.7")

sys.path = [pylibtiffpath] + sys.path
print pylibtiffpath
import ctypes

# print tplpath
from libtiff import TIFF

# for atag in tiff.IFD:
from libtiff.libtiff_ctypes import libtiff
from libtiff.libtiff_ctypes import c_ttag_t
import logging


def get_bif_stitch_info(fname):
    # fname = "/home/dhan/data/bif/1048676_2_1.bif"

    tif = TIFF.open(fname, "r")
    jpegtable_size = ctypes.c_uint16()
    buf = ctypes.c_voidp()

    libtiff.TIFFSetDirectory(tif, 2)
    print "Directory: ", libtiff.TIFFCurrentDirectory(tif).value

    # Customize the argument types for getting a raw buffer stored in tag
    libtiff.TIFFGetField.argtypes = libtiff.TIFFGetField.argtypes[:2] +\
        [ctypes.POINTER(ctypes.c_uint16), ctypes.POINTER(ctypes.c_void_p)]

    libtiff.TIFFGetField(tif, 700, jpegtable_size, ctypes.byref(buf))

    jpegtables = ctypes.cast(buf, ctypes.POINTER(ctypes.c_char))
    print "Size of jpegtables: %d" % (jpegtable_size.value)

    # Roll back the customizations
    libtiff.TIFFGetField.argtypes = [TIFF, c_ttag_t, ctypes.c_void_p]

    xmltext = ctypes.string_at(jpegtables)
    return xmltext


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)

    print get_bif_stitch_info(sys.argv[1])

