
import sys
import os
import subprocess
import time
import json

import logging
logger = logging.getLogger('slideatlas')

from . import MongoUploader
from . import WrapperReader

__all__ = ('MongoUploaderWrapper', )


class MongoUploaderWrapper(MongoUploader):
    """
    Class for uploading using image_uploader wrapper
    """
    def __init__(self, args):
        super(MongoUploaderWrapper, self).__init__(args)

    def make_reader(self):
        """
        Creates a ptif reader
        """

        try:
            reader = WrapperReader({"fname": self.args["input"], 'bindir': self.args["bindir"]})
            # Introspect
            logger.info('Dimensions: (%d, %d)', reader.width, reader.height)
        except:
            logger.error('Unable to read input file %s', self.args['input'])
            sys.exit(0)

        return reader

    def upload_base(self):
        """
        Does not depend on the reader, instead wraps the image_uploader utility
        Expects the reader and the imagestore to be setup before
        """

        if self.args["dry_run"]:
            logger.info('Dry run .. not uploading base')
            return

        istore = self.imagestore

        if os.name == 'nt':
            args = [self.args["bindir"] + "image_uploader.exe", "-m", istore.host.split(",")[0], "-d", istore.dbname, "-c", str(self.imageid), self.args["input"]]
            if len(istore.username) > 0:
                args = args + ["-u", istore.username, "-p", istore.password]
        else:
            args = [self.args["bindir"] + "/image_uploader", "-m", istore.host.split(",")[0], "-d", istore.dbname, "-c", str(self.imageid), self.args["input"]]
            if len(istore.username) > 0:
                args = args + ["-u", istore.username, "-p", istore.password]

            # args = " ".join(args)

        logger.info('Params: %s', str(args))
        # Get the information in json

        proc = subprocess.Popen(args, stdout=subprocess.PIPE, cwd=self.args["bindir"], shell=False)

        while True:
            time.sleep(0)

            result = proc.poll()

            if not (result is None):
                # Process died
                if not result == 0:
                    logger.error('Process died without any output')
                    sys.exit(1)

            output = proc.stdout.readline()
            #print output

            try:
                js = json.loads(output)
            except:
                logger.error('Invalid json output from image_uploader: "%s"', output)
                sys.exit(1)

            if "error" in js:
                logger.error('image_uploader says: %s', js['error'])
                sys.exit(1)

            if "information" in js:
                logger.info('Information available')

            if "progress_percent" in js:
                logger.info('Progress : %f' % js['progress_percent'])

            if "success" in js:
                logger.info('DONE')
                break
