
"""
Introspect the system to know which readers are available

"""
from .pil_reader import PilReader
from .openslide_reader import OpenslideReader
from .preprocess_reader import PreprocessReader

import os
import logging
logger = logging.getLogger("ReaderFactory")
logger.setLevel(logging.ERROR)

class ReaderFactory(object):

    def __init__(self):
        self.readers = []

    def supported_formats(self):
        """
        Introspect the system and come up with a dictionary of supported formats and their
        priority
        """

        raise NotImplementedError()

    def open(self, fname, extra={}):
        ext = os.path.splitext(fname)[1][1:].lower()
        # logger.error("Why making reader in base ??")
        # This code also duplicated in TileProcessor belongs really to reader factory
        reader = None
        logger.info("uploader_base: Got extension: " + ext)
        if ext in ["svs", "ndpi", "scn", "tif", "bif"]:
            from slideatlas.ptiffstore.openslide_reader import OpenslideReader
            reader = OpenslideReader()
        elif ext in ["jpg", "png"]:
            reader = PilReader()
        elif ext in ["jp2", "j2k"]:
            # formats that need conversion using outside utilities
            from slideatlas.ptiffstore.preprocess_reader import PreprocessReaderJp2
            kakadu_dir = extra["kakadu_dir"] if "kakadu_dir" in extra else None
            reader = PreprocessReaderJp2(kakadu_dir=kakadu_dir)
        else:
            logger.error("Unknown extension: " + ext)
            sys.exit(-1)

        reader.set_input_params({'fname' : fname})
        return reader

if __name__ == "__main__":
    # ReaderFactory can be quickly tested by having to choose readers for a variety 
    # of supported formats
    # unittest.main()
    pass
