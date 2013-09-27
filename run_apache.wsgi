import sys
sys.path.append("/var/slideatlas-admin")
import logging
logging.basicConfig(stream=sys.stderr)
from slideatlas import app as application

