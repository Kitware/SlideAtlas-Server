To install dependencies
-----------------------

Requires python 2.7x, and pip.

Click here to install `python <http://www.python.org/download/>`_ and `pip <http://stackoverflow.com/questions/4750806/how-to-install-pip-on-windows>`_ on windows. 

Also please make sure that the python and scripts ("c:/python27/Scripts") are in PATH environment variable.

To install dependencies mentioned in **requirements.txt**

.. code-block:: none

   $ pip install -r requirements.txt


To build third party dependencies 
---------------------------------

Third party dependencies / libraries (TPL) are included as submodules.


Few packages may be required for compiling on ubunbu 12.04 lts

.. code-block:: none

   $ sudo apt-get install build-essential libjpeg-dev

The procedure to build TPL is as follows 

.. code-block:: none

   $ git submodule update --init 
   $ cd slideatlas/ptiffstore/tpl/tiff-4.0.3/
   $ ./configure
   $ make

Please make sure JPEG support is supported in the configuration. 



To build documentation
----------------------
Detailed documentation can be built using sphinx

.. code-block:: none

   $ cd docs
   $ make html

To test
-------

CMake is required for testing.

.. code-block:: none

   $ cd testing
   $ ctest -S ctest_driver.cmake


To run 
------

.. code-block:: shell-session

  $(export SLIDEATLAS_CONFIG_PATH=/home/dhan/projects/slideatlas-config-kitware/localhost/site_slideatlas.py ;  gunicorn -k flask_sockets.worker run_websockets:app -b localhost:8080 --log-level=debug)



To run without websockets support
---------------------------------

.. code-block:: none

   $ EXPORT SLIDEATLAS_CONFIG_PATH=/path/to/site_config
   $ python run.py

.. code-block:: shell-session

  $(export SLIDEATLAS_CONFIG_PATH=/home/dhan/projects/slideatlas-config-kitware/localhost/site_slideatlas.py ;  python run.py)

"/path/to/site_config" should be the absolute path to a configuration file with any locally-specific configuration changes. 

If such a configuration file is not provided, SlideAtlas will use sensible defaults (e.g. connecting to a MongoDB at 'localhost:8080').


Sample Apache configuration
---------------------------

.. code-block:: none

  <VirtualHost admin.slide-atlas.org:80>
       ServerName admin.slide-atlas.org
       ServerAdmin dhanannjay.deo@kitware.com

       WSGIDaemonProcess slideatlas user=www-data group=www-data threads=1
       WSGIScriptAlias / /var/slideatlas-admin/run_apache.wsgi

       <Directory /var/slideatlas-admin>
           WSGIProcessGroup slideatlas
           WSGIApplicationGroup %{GLOBAL}
           Order deny,allow
           Allow from all
       </Directory>

        ErrorLog ${APACHE_LOG_DIR}/error.log

        # Possible values include: debug, info, notice, warn, error, crit,
        # alert, emerg.
        LogLevel warn

        CustomLog ${APACHE_LOG_DIR}/access.log combined

  </VirtualHost>
