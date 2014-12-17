import os
from base_reader import InvertedReader
from common_utils import get_max_depth
import openslide

import logging
logger = logging.getLogger('slideatlas')

__all__ = ("OpenslideReader", )

class OpenslideReader(InvertedReader):

    def __init__(self):
        super(OpenslideReader, self).__init__()

    def set_input_params(self, params):
        self._reader = openslide.OpenSlide(params['fname'])
        self.name = os.path.basename(params["fname"])

        self.width = self._reader.dimensions[0]
        self.height = self._reader.dimensions[1]
        self.num_levels = get_max_depth(self.width, self.height)
        logger.debug('Num Levels: %s', self.num_levels)
        # TODO: deduce the vendor specific metadata
        self.origin = [0, 0, 0]
        self.spacing = [1, 1, 1]
        self.components = 3

    def read_region(self, box):
        """
        Implementing read_region for openslide reader
        """
        logger.info('BOX: %s', str(box))
        return self._reader.read_region((box[0], box[1]), 0, (box[2] - box[0], box[3] - box[1]))


if __name__ == "__main__":

    reader = OpenslideReader()
    reader.set_input_params({"fname": "/home/dhan/Downloads/Leica-1.scn"})
    i = reader.get_tile(26000, 83000)
    logger.debug('%s', reader.name)
    i.save("tile.jpg")
