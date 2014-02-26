Gettting started
================

.. include:: ../README.rst
    
Before running
--------------
Setting up Database
~~~~~~~~~~~~~~~~~~~
A good place to start  is setup mongodb, and restore demo database from backups

The database schema keeps evolving and the restored database might not work out of box,
though DJ will take care that the most recent database is backed up.

Admin database also needs setup, there is create_new_slideatlasdb to start with a template. Otherswise it Configuration

In the long run it should be possible to start from a blank admin databse, create site administrator and
add the availabel database to automatically insert all metadata needed with


Configuring database connection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Flask app loads configuration while it initializes. Most of the configuration parameters are either manually selected in slideatlas/__init__.py.
Site specific configuration must be correctly loaded

.. code-block:: python 
   :emphasize-lines: 4

   app = Flask(__name__)
   # Configure here teh path to put downloaded folders 
   app.config['UPLOAD_FOLDER'] = "d:/docs"
   app.config.from_object("site_local")

Which loads

.. code-block:: python 

    MONGO_SERVER = "slide-atlas.org:27017"
    CONFIGDB = "slideatlasv2"

    LOGIN_REQUIRED = True
    USERNAME = "put_user_name_here"
    PASSWORD = "put_password_here"

    # Facebook with correct redirection
    FACEBOOK_APP_ID = '#################'
    FACEBOOK_APP_SECRET = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

    # Rule corresponding to the data which is to be made public
    # ObjectId string
    DEMO_RULE = "123456789012345678901234"

    # Settings for sending email out
    # Following settings would work from within kitware
    EMAIL_FROM = "dhanannjay.deo@kitware.com"
    SMTP = "public.kitware.com"

