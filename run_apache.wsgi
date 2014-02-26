import sys
sys.path.append("/home/claw/SlideAtlas-Server")
import logging
logging.basicConfig(stream=sys.stderr)
from connectome import app as application

