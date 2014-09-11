import sys
import os


tplpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "tpl"))

# TODO: Make following paths work in windows after openslide is compiled in windows
openslide_libpath = os.path.join(tplpath, "openslide", "src", ".libs", "libopenslide.so.0")
# openslide_pythonpath = os.path.join(tplpath, "openslide-python", "build", "lib.linux-x86_64-2.7")

# sys.path = [openslide_pythonpath] + sys.path
# sys.path = [openslide_libpath] + sys.path
# os.environ["PATH"] = openslide_libpath + ":" + os.environ["PATH"]
# Load the library before so that openslide module will find it

from ctypes import cdll
_dummylib = cdll.LoadLibrary(openslide_libpath)

import openslide


class SlideAtlasImageReader(object):

    def __init__(self):
        pass


class OpenSlideReader(SlideAtlasImageReader):

    def __init__(self):
        super(OpenSlideReader, self).__init__()

    def set_input_params(self, params):
        self._reader = openslide.OpenSlide(params['fname'])


if __name__ == "__main__":

    reader = OpenSlideReader()
    reader.set_input_params({"fname": "/home/dhan/Downloads/Leica-1.scn"})
