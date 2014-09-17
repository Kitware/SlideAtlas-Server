import sys
import os
from PIL import Image

from base_reader import Reader
from common_utils import get_max_depth

__all__ = ("PilReader", )


class PilReader(Reader):

    def __init__(self):
        super(PilReader, self).__init__()

    def set_input_params(self, params):
        self._reader = Image.open(params["fname"])
        self.name = os.path.basename(params["fname"])
        self.width = self._reader.size[0]
        self.height = self._reader.size[1]
        self.num_levels = get_max_depth(self.width, self.height)

        # TODO: deduce the vendor specific metadata
        self.origin = [0, 0, 0]
        self.spacing = [1, 1, 1]
        self.components = 3

    def read_region(self, location, size, level=0):
        """
        Implementing read_region for openslide reader
        """

        # Left, top, bottom, right
        #TODO: Convert the coordimates
        return self._reader.crop([location[0], location[1], location[0] + size[0], location[1] + size[1]])


if __name__ == "__main__":

    reader = PilReader()
    reader.set_input_params({"fname": "/home/dhan/Downloads/3d.jpg"})
    i = reader.get_tile(0, 0)
    print reader.name
    i.save("tile.jpg")
