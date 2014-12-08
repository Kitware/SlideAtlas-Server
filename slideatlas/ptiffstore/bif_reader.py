from PIL import Image
from openslide_reader import OpenslideReader
import openslide

import logging
logger = logging.getLogger("BIFReader")
logger.setLevel(logging.ERROR)


class BifReader(OpenslideReader):

    def set_input_params(self, params):
        super(BifReader, self).set_input_params(params)
        # Set slide background color
        # Tried to get if from slide if available
        self._bg_color = '#' + self._reader.properties.get(
                        openslide.PROPERTY_NAME_BACKGROUND_COLOR, 'ffffff')

    def read_region(self, box):
        """
        Apply light background
        """
        # Invoke parent to post process the results later
        image = super(BifReader,self).read_region(box)

        # Apply on solid background
        bg = Image.new('RGB', image.size, self._bg_color)
        image = Image.composite(image, bg, image)
        return image


def test_bifreader():
    bif = BifReader()
    bif.set_input_params({"fname" : "/media/dhan/precise/home/dhan/data/bif/1083404_1_1_20x.bif"})
    tile = bif.read_region([5000, 5500, 5200, 5700])
    tile.save("output.jpg")

if __name__ == "__main__":
    test_bifreader()
