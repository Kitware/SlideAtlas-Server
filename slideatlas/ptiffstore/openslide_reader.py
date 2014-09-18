import sys
import os
from base_reader import InvertedReader
from common_utils import get_max_depth
tplpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "tpl"))

# TODO: Make following paths work in windows after openslide is compiled in windows
openslide_lib = os.path.join(tplpath, "openslide", "src", ".libs", "libopenslide.so.0")

from ctypes import cdll
_dummylib2 = cdll.LoadLibrary("libopenjp2.so.7")
_dummylib = cdll.LoadLibrary(openslide_lib)

import openslide

__all__ = ("OpenslideReader", )

import logging
logger = logging.getLogger("OpenslideReader")
logger.setLevel(logging.ERROR)


class OpenslideReader(InvertedReader):

    def __init__(self):
        super(OpenslideReader, self).__init__()

    def set_input_params(self, params):
        self._reader = openslide.OpenSlide(params['fname'])
        self.name = os.path.basename(params["fname"])

        self.width = self._reader.dimensions[0]
        self.height = self._reader.dimensions[1]
        self.num_levels = get_max_depth(self.width, self.height)
        logger.info("Num Levels: %s" % self.num_levels)
        # TODO: deduce the vendor specific metadata
        self.origin = [0, 0, 0]
        self.spacing = [1, 1, 1]
        self.components = 3

    def read_region(self, box):
        """
        Implementing read_region for openslide reader
        """
        logger.info("BOX: " + str(box))
        return self._reader.read_region((box[0], box[1]), 0, (box[2] - box[0], box[3] - box[1]))


if __name__ == "__main__":

    reader = OpenslideReader()
    reader.set_input_params({"fname": "/home/dhan/Downloads/Leica-1.scn"})
    i = reader.get_tile(26000, 83000)
    print reader.name
    i.save("tile.jpg")
