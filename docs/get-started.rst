Getting started
================

.. include:: ../readme.rst

Before running
--------------

Configuration paramters for slideatlas are as follows -

.. automodule:: slideatlas.default_config
  :members:
  :undoc-members:


During runtime, slidetlas looks for environment variable "SLIDEATLAS_CONFIG_PATH" and loads the configuration variables from the python file pointed by it.

.. warning::

    Any documentation below in this sections needs to be reviewed


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
