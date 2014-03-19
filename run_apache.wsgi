import sys
sys.path.append("/var/www/wsgi/SlideAtlas-Server")
import logging
logging.basicConfig(stream=sys.stderr)
from slideatlas import app as application

