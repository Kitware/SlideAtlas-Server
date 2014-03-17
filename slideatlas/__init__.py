
import sys, os

from slideatlas.core import create_app

# Create App
app = create_app()
#sys.path.append(os.path.dirname(__file__))


# from celery import Celery
# celery = Celery(broker="mongodb://127.0.0.1/slideatlas-tasks", backend="mongodb://127.0.0.1/slideatlas-tasks")

# Configure here teh path to put downloaded folders
# (should be big and with write access to web server user)
# 'slideatlas/jqueryupload/__init__.py' uses this variable
app.config['UPLOAD_FOLDER'] = "d:/docs"
