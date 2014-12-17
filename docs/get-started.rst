Getting started
================

.. include:: ../readme.rst

Configuring SlideAtlas
----------------------

During runtime, slidetlas looks for environment variable "SLIDEATLAS_CONFIG_PATH" and loads the configuration variables from the python file pointed by it.
A sample configuration file "site_config.py" that overrides few settings is as follows -

.. code-block:: python

  # The MongoDB database name of the admin database.
  SLIDEATLAS_ADMIN_DATABASE_NAME = 'my_slideatlas_admin_database'

  #The password to authenticate to the admin database with, if any.
  SLIDEATLAS_ADMIN_DATABASE_PASSWORD = "super_secret_password"

  #The username to authenticate to the admin database with, if any.
  SLIDEATLAS_ADMIN_DATABASE_USERNAME = "secret_username"

For example, when running from bash, location of this file should be stored in "SLIDEATLAS_CONFIG_PATH" as follows

.. code-block:: none

  $ export SLIDEATLAS_CONFIG_PATH="/home/projects/path_to_config/site_config.py"
  $ python run.py

List of default configuration paramters for slideatlas are as follows -

.. automodule:: slideatlas.default_config
  :members:
  :undoc-members:


