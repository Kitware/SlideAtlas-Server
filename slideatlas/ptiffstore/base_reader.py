from PIL import Image

import logging
logger = logging.getLogger("BaseReader")
logger.setLevel(logging.ERROR)


class Reader(object):
    """
    Generic reader for uploader
    """
    def __init__(self, params=None):
        if params:
            self.set_input_params(params)
        self.spacing = [1.0, 1.0, 1.0]
        self.origin = [0., 0., 0.]
        self.components = 3

    def get_white_tile(self, tilesize):
        return Image.new('RGB', (tilesize, tilesize), color=(255, 255, 255))

    def set_input_params(self, params):
        self.params = params
        if not params["bindir"].endswith("/"):
            params["bindir"] = params["bindir"] + "/"

    def get_tile(self, x, y, tilesize=256):
        """
        helper function to get a particular tile.
        The tile containing absolute pixels specified by x and y
        is returned
        """
        return self.read_region((x, y), (tilesize, tilesize))

    def read_region(self, location, size, level=0):
        """
        """
        raise NotImplementedError


class InvertedReader(Reader):

    def read_tile(self, x_index, y_index, tilesize):
        """
        Implementing read_region for openslide reader
        """
        # In our case we invert

        left = x_index * tilesize
        right = left + tilesize
        top = self.height - ((y_index + 1) * tilesize)
        bottom = top + tilesize

        logger.info("Before: left: %d, top: %d, right: %d, bottom: %d" % (left, top, right, bottom))
        logger.info("Width: %d, Height: %d" % (self.width, self.height))
        needs_padding = False
        # Clip the bounds with respect to image size
        if bottom > self.height:
            bottom = self.height
            needs_padding = True

        if top < 0:
            top = 0
            needs_padding = True

        if right > self.width:
            right = self.width
            needs_padding = True

        # If bottom more than width
        logger.info("left: %d, top: %d, right: %d, bottom: %d" % (left, top, right, bottom))
        output = self.read_region([left, top, right, bottom])

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
