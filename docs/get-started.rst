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

   MONGO_SERVER = "localhost:27017"
   CONFIGDB = "slideatlasv2"
   
   LOGIN_REQUIRED = False
   USERNAME = "put_user_name_here"
   PASSWORD = "put_password_here"
      
Starting with empty database
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

After the upload workflow is complete, it should be okay to start with a blank database, with creation of an site-admin account.

If the designated database is empty, the user will be informed so, and the wizard will allow creation of one site administrator from the "about" page.

Later on when the database is not empty, the about page will show the name of current administrator and a button to possibly contact / email the administrator for support.

The structure that needs to be created is

- databases
- users
- rules

The main tasks to be implemented

- The admin user will perhaps create a new database (register a pre-existing database with the system).
- Create password users, or wait for email users to create accounts here
- Grant them db_admin previleges
- Create sessions in database and grant session admin previlege to other user
- Add images there
- Monitor upload process (the users that are db_admins, should also see the processing messages related with their database)







