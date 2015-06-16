import os

from openslide_reader import OpenslideReader
import subprocess

__all__ = ("PreprocessReader", )

import logging

logger = logging.getLogger('slideatlas')
from lockfile import LockFile


class PreprocessReader(OpenslideReader):
    def __init__(self):
        logger.info('PreprocessReader init')
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

    def __init__(self, kakadu_dir=None):
        # logger.info('PreprocessReaderJp2 init')
        self.kakadu_dir = kakadu_dir
        super(PreprocessReaderJp2, self).__init__()

    def pre_process(self, params):
        """
        Converts the files

        First pass is to create striped tiff using kakadu if available
        and second pass is to convert to tiled tiff.

        A third file path is used for lock, if the lock can be acquired
        and the output is not ready then create it.  If the lock cannot
        be acquired then perhaps other process is processing it.

        TODO: Decide when to declare not possible ?
        """
        # Split the requested filename
        dirname, filename = os.path.split(params["fname"])
        _, ext = os.path.splitext(filename)

        # assert that ext is as expected
        assert ext in [".jp2", ".j2k"]

        output1 = os.path.join(dirname, filename + "_striped.tif")
        output2 = os.path.join(dirname, filename + "_tiled.tif")
        lock_path = os.path.join(dirname, filename + ".lock")

        lock = LockFile(lock_path)
        # logger.info('waiting for lock')
        lock.acquire()
        # If the file is missing then create it
        if not os.path.exists(output2):
            # Make sure the processing lock can be acquired
            logger.info('processing')

            logger.info('# Convert to striped tiff')
            if self.kakadu_dir is None:
                params = ["gdal_translate", params["fname"], output1]
                subprocess.call(params)
            else:
                # Additional LD_LIBRARY_PATH
                environ = os.environ.copy()

                if "LD_LIBRARY_PATH" not in environ:
                    environ["LD_LIBRARY_PATH"] = ""

                environ["LD_LIBRARY_PATH"] = self.kakadu_dir + ":" + environ["LD_LIBRARY_PATH"]
                params = [os.path.join(self.kakadu_dir, "kdu_expand"), "-i", params["fname"], "-o", output1]
                subprocess.call(params, env=environ)

            logger.info('# Convert to tiled tiff')
            params = ["gdal_translate", "-co", "TILED=YES", "-co", "COMPRESS=JPEG", output1, output2]
            subprocess.call(params)

            # Then remove output1
            os.remove(output1)
        lock.release()
        return output2


class PreprocessReaderTif(PreprocessReader):
    """
    uses vips to convert tiff into tiled format if not already
    files to tiled tiff which are then absorbed by OpenslideReader
    """

    def __init__(self, kakadu_dir=None):
        # logger.info('PreprocessReaderJp2 init')
        self.kakadu_dir = kakadu_dir
        super(PreprocessReaderTif, self).__init__()

    def pre_process(self, params):
        """
        Converts the files

        First pass is to create striped tiff using kakadu if available
        and second pass is to convert to tiled tiff.

        A third file path is used for lock, if the lock can be acquired
        and the output is not ready then create it.  If the lock cannot
        be acquired then perhaps other process is processing it.

        TODO: Decide when to declare not possible ?
        """
        # Split the requested filename
        dirname, filename = os.path.split(params["fname"])
        name, ext = os.path.splitext(filename)

        # assert that ext is as expected
        assert ext in [".tif", ".tiff"]

        output1 = os.path.join(dirname, name + "_tiled.tif")
        lock_path = os.path.join(dirname, filename + ".lock")

        lock = LockFile(lock_path)
        # logger.info('waiting for lock')
        lock.acquire()
        # If the file is missing then create it
        if not os.path.exists(output1):
            # Make sure the processing lock can be acquired
            logger.info('processing')
            logger.info('# Convert to tiled tiff')

            params = ["vips", "tiffsave", params["fname"], output1,
                      "--compression=jpeg", "--tile", "--tile-width=256",
                      "--tile-height=256", "--bigtiff"]

            subprocess.call(params)

        lock.release()
        return output1


if __name__ == "__main__":
    reader = PreprocessReaderTif()
    reader.set_input_params({"fname": "/home/local/KHQ/dhanannjay.deo/data/tif/try.tif"})
    logger.debug('%s', reader.name)
    # i = reader.get_tile(26000, 83000)
    # i.save("tile.jpg")
