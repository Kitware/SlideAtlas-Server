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

    def read_tile(self, x_index, y_index, tilesize):
        """
        Implementing read_region for openslide reader
        """
        # In our case we invert

        left = x_index * tilesize
        right = left + tilesize
        top = self._reader.size[1] - ((y_index + 1) * tilesize)
        bottom = top + tilesize

        needs_padding = False
        # Clip the bounds with respect to image size
        if bottom > self._reader.size[1]:
            bottom = self._reader.size[1]
            needs_padding = True

        if top < 0:
            top = 0
            needs_padding = True

        if right > self._reader.size[0]:
            right = self._reader.size[0]
            needs_padding = True

        # If bottom more than width
        logger.info("left: %d, top: %d, right: %d, bottom: %d" % (left, top, right, bottom))
        output = self._reader.crop([left, top, right, bottom])

        if needs_padding:
            # Paste the acquired image into white_tile
            w = output.size[0]
            h = output.size[1]

            wi = self.get_white_tile(tilesize)
            logger.info("Pasting at: %s" % [0, tilesize-h])
            wi.paste(output, (0, tilesize-h, w, tilesize))

            # empty bi
            del output
            output = wi

        return output

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
