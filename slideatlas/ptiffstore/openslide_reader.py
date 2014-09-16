import sys
import os
from base_reader import Reader
tplpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "tpl"))

# TODO: Make following paths work in windows after openslide is compiled in windows
openslide_lib = os.path.join(tplpath, "openslide", "src", ".libs", "libopenslide.so.0")

from ctypes import cdll
_dummylib2 = cdll.LoadLibrary("libopenjp2.so.7")
_dummylib = cdll.LoadLibrary(openslide_lib)

import openslide


class OpenSlideReader(Reader):

    def __init__(self):
        super(OpenSlideReader, self).__init__()

    def set_input_params(self, params):
        self._reader = openslide.OpenSlide(params['fname'])

        self.width = self._reader.dimensions[0]
        self.height = self._reader.dimensions[1]
        self.num_levels = self._reader.level_count
        self.origin = js["origin"]
        self.spacing = js["spacing"]
        self.components = js["components"]
        print self._reader.dimensions


if __name__ == "__main__":

    reader = OpenSlideReader()
    reader.set_input_params({"fname": "/home/dhan/Downloads/Leica-1.scn"})
