import sys
sys.path.append("/var/connectome")
import logging
logging.basicConfig(stream=sys.stderr)
from connectome import app as application

