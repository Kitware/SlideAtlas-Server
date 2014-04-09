Getting started
================

.. include:: ../readme.rst

Before running
--------------

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

    # For mongodb server connections
    # MONGO_IS_REPLICA_SET = False
    # MONGO_URL = "slide-atlas.org:27017"
    # CONFIGDB = "slideatlasv2"

    # For replica set connection
    LOGIN_REQUIRED = True
    MONGO_IS_REPLICA_SET = True
    MONGO_URL = "slide-atlas.org:27017,mini.slide-atlas.org:27021,new.slide-atlas.org:27017"
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

Setting up empty database
-------------------------

This is work in progress

It is possible to start from an empty admin database, create site administrator and
register new or already existing image databases to it.

 This will make it possible to accommodate several slide-atlas instances on a single mongodb server, each having a separate admin database. Or as the current schema allows, distribute a single slide-atlas instance over several accessible mongodb servers.

Workflow
~~~~~~~~

If the designated database is empty, the user will be informed so, and the wizard will allow creation of one site administrator from the "about" page. Later on when the database is not empty, the about page will show the name of current administrator and a button to possibly contact / email the administrator for support.

The structure that needs to be created is

- databases
- users
- rules

tasks
~~~~~

tasks to be implemented are as follows

- The admin user will perhaps create a new database (register a pre-existing database with the system).
- Create password users, or wait for email users to create accounts here
- Grant them db_admin privileges
- Create sessions in database and grant session admin privilege to other user
- Add images there
- Monitor upload process (the users that are db_admins, should also see the processing messages related with their database)
