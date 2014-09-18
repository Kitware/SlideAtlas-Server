import sys
import os
from PIL import Image

from base_reader import Reader
from common_utils import get_max_depth, get_tile_index
import logging
logger = logging.getLogger("PilReader")
logger.setLevel(logging.INFO)

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

    def get_tile_indexes(self, name):
        # Now get the coordinates
        # Convert them
        # Get the new name
        # Get the coordinates

        pass

    def read_tile(self, x_index, y_index, tilesize):
        """
        Implementing read_region for openslide reader
        """
        # In our case we invert

        left = x_index * tilesize
        right = left + tilesize
        top = self._reader.size[1] - ((y_index + 1) * tilesize)
        bottom = top + tilesize

        # Clip the bounds with respect to image size
        if bottom > self._reader.size[1]:
            bottom = self._reader.size[1]

        if top < 0:
            top = 0

        if right > self._reader.size[0]:
            right = self._reader.size[0]

        # If bottom more than width
        logger.info("left: %d, top: %d, right: %d, bottom: %d" % (left, top, right, bottom))
        return self._reader.copy().crop([left, top, right, bottom])

    def read_region(self, location, size, level=0, name=None):
        """
        Implementing read_region for openslide reader
        """

        assert name is not None
        # Translate the location with respect to
        # Left, top, right, bottom
        #TODO: Convert the coordimates
        [x_index, y_index, zoom] = get_tile_index(name)
        left = location[0]
        top = self.height - (y_index + 1)
        right = left + size[0]
        bottom = top - size[1]
        logger.info("left: %d, top: %d, right: %d, bottom: %d" % (left, top, right, bottom))
        return self._reader.copy().crop([left, bottom, right, top])


if __name__ == "__main__":

    reader = PilReader()
    reader.set_input_params({"fname": "/home/dhan/Downloads/3d.jpg"})
    i = reader.get_tile(0, 0)
    print reader.name
    i.save("tile.jpg")
