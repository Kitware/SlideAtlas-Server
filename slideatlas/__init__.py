# coding=utf-8

from slideatlas.core import create_app

# Create App
app = create_app()


# Configure here teh path to put downloaded folders
# (should be big and with write access to web server user)
# 'slideatlas/jqueryupload/__init__.py' uses this variable
app.config['UPLOAD_FOLDER'] = "d:/docs"
