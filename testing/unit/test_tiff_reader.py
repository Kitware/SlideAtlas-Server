import os
import sys
import logging
from bson import ObjectId

logging.basicConfig(level=logging.INFO)

slideatlaspath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(slideatlaspath)

from slideatlas.ptiffstore.tiff_reader import TileReader

DATA_ROOT = "/home/dhan/data/slideatlas_tests"

def examine_ptif(path):
    reader = TileReader()
    reader.set_input_params({'fname' : path})
    reader.parse_image_description()
    logger.info("Width: %s"%reader.width)
    logger.info("Height: %s"%reader.height)
    # logger.info("Components: %s"%reader.components)



def test_ptif_from_philips():
    examine_ptif(DATA_ROOT + "/ptif-philips/20140721T182320-963749.ptif")

def test_tif_from_zeiss():
    examine_ptif(DATA_ROOT + "/ptif-zeiss/2014_07_01__0009-S09.tif")


if __name__ == "__main__":
    """
    Run few tests
    This class will be finally imported from tiff server
    """
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    test_tif_from_zeiss()
    # test_ptif_from_philips()

    # import nose
    # nose.run(defaultTest=__name__)

