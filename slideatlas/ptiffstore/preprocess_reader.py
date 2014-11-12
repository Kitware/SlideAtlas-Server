import sys
import os
from base_reader import InvertedReader
from common_utils import get_max_depth
tplpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "tpl"))

import openslide
from openslide_reader import OpenslideReader

__all__ = ("PreprocessReader", )

import logging
logger = logging.getLogger("PreprocessReader")
logger.setLevel(logging.ERROR)


class PreprocessReader(OpenslideReader):

    def __init__(self):
        logger.info("PreprocessReader init")
        super(PreprocessReader, self).__init__()

    def pre_process(self, params):
        """
        Converts the files
        """
        raise NotImplementedError()

    def set_input_params(self, params):
        """
        Accepts the input file
        """
        params["oldfname"] = params["fname"]
        params["fname"] = self.pre_process(params)
        super(PreprocessReader, self).set_input_params(params)


class PreprocessReaderJp2(PreprocessReader):
    """
    uses kakadu if available or otherwise gdal to convert jp2
    files to tiled tiff which are then absorbed by OpenslideReader
    """

    def __init__(self):
        logger.info("PreprocessReaderJp2 init")
        super(PreprocessReaderJp2, self).__init__()

    def pre_process(self, params):
        """
        Converts the files
        """
        logger.warning("Would preprocess jp2 image here")
        return "/mnt/d/scratch/Bretagne2_tiled.tif"

if __name__ == "__main__":
    reader = PreprocessReaderJp2()
    reader.set_input_params({"fname": "/home/dhan/Downloads/jp2/Bretagne2.j2k"})
    print reader.name
    # i = reader.get_tile(26000, 83000)
    # i.save("tile.jpg")
