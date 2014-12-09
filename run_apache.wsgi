# coding=utf-8

import os
import sys

# Apache is unable to set environment variables until after the first request is served
# os.environ['SLIDEATLAS_CONFIG_PATH'] = ''

sys.path.append('/var/www/wsgi/SlideAtlas-Server')
from slideatlas import create_app
application = create_app()
