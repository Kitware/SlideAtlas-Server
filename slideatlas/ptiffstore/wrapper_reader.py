import sys
import os
import subprocess
import json
# sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")

from .base_reader import Reader

import logging
logger = logging.getLogger("WrapperReader")
logger.setLevel(logging.INFO)


class WrapperReader(Reader):
    def __init__(self, params=None):
        super(WrapperReader, self).__init__(params)

    def set_input_params(self, params):
        """
        Resets the state of the reader to the default using inputs provided
        """
        super(WrapperReader, self).set_input_params(params)

        logger.info("Received following input params: %s" % params)
        fullname = params["fname"]
        name = os.path.basename(fullname)
        self.name = name

        # Perform extension specific operation here
        # TODO: Use the extension to determine the capability
        # extension = os.path.splitext(fullname)

        # params = ["./image_uploader", "-m", "new.slide-atlas.org", "-d",
        #                       istore.dbname, "-n", self.params["fname"]]
        # if len(istore.username) > 0:
        #     params = params + ["-u", istore.username, "-p", istore.password]

        if os.name == 'nt':
            params = [self.params["bindir"] + "image_uploader.exe", "-n", fullname]
        else:
            params = [self.params["bindir"] + "image_uploader", "-n", fullname]
            # params = " ".join(params)

        logger.info("Params: " + str(params))
        # Get the information in json

        try:
            output, erroutput = subprocess.Popen(params, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                                 cwd=self.params["bindir"],
                                                 shell=False).communicate()
        except OSError as e:
            logger.error("Fatal error from OS while executing \
                          image_uploader (possible incorrect --bindir): \
                          %s" % e.message)
            sys.exit(-1)

        logger.error("ErrOutput")
        logger.error(erroutput)
        js = {}
        try:
            js = json.loads(output)
        except Exception as e:
            logger.error("Fatal error Output of image_uploader \
                not valid json: %s" % output)

            logger.error("Message : %s" % e.message)
            sys.exit(-1)

        logger.info("JS: %s" % js)

        if js.has_key('error'):
            anitem.textStatus.SetLabel("Error")
            logger.error("Fatal error UNREADABLE input:\n%s"%(output))
            sys.exit(-1)

        if not js.has_key("information"):
            logger.error("Fatal error NO INFORMATION")
            sys.exit(-1)

        self.width = js["dimensions"][0]
        self.height = js["dimensions"][1]
        self.num_levels = js["levels"]
        self.origin = js["origin"]
        self.spacing = js["spacing"]
        self.components = js["components"]
        # # Should have connection info
        # if not js.has_key('connection'):
        #     logger.error("Fatal error NO CONNECTION")
        #     sys.exit(0)

