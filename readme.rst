Getting started with SlideAtlas
-------------------------------

This document describes setting up SlideAtlas on linux, in particular on ubuntu releases 12.04 and 14.04,
but it should be easy to interpret these instructions for platforms as well.

Python, pip and subversion-tools required, they can be installed by using

.. code-block:: none

   $ sudo apt-get install subversion-tools python2.7 python-pip

Third party libraries
---------------------

SlideAtlas depends on several third party softwares and expects them to be installed on the system.

ubunbu 14.04 lts
~~~~~~~~~~~~~~~~

Required packages libtiff5-dev and openslide-tools are both available in ubuntu release 14.04

Install them using

.. code-block:: none

   $ sudo apt-get install openslide-tools libtiff5-dev

ubunbu 12.04 lts
~~~~~~~~~~~~~~~~

Latest versions of libtiff and openslide must be compiled from source. Following packages are required for successful compilation

.. code-block:: none

   $ sudo apt-get install sudo apt-get install autoconf automake libtool pkg-config libgtk2.0-dev
   $ sudo apt-get install libxml2-dev libjpeg-dev liblzma-dev liblz-dev zlib1g-dev lzma libmatio-dev
   $ sudo apt-get install libexif-dev libfftw3-dev swig python-dev liborc-0.4-dev libsqlite3-dev

Building Libtiff4
~~~~~~~~~~~~~~~~~

.. code-block:: none

  wget ftp://ftp.remotesensing.org/pub/libtiff/tiff-4.0.3.tar.gz

  tar xvzf tiff-4.0.3.tar.gz
  cd tiff-4.0.3/
  ./configure
  make
  sudo make install

Building Openslide
~~~~~~~~~~~~~~~~~~

.. code-block:: none

  git clone git://github.com/openslide/openslide.git
  cd openslide
  autoreconf -i
  make
  sudo make install


.. warning::

  If any plugins are enabled, their dependencies should be installed accordingly. For more details see :ref:`plugins`


Install python packages
-----------------------

Once third party libraries are installed on the system, the required python packages mentioned
in **requirements.txt** can be installed with

.. code-block:: none

   $ sudo pip install -r requirements.txt

.. note:: none

    Some more packages may be required at this stage


Building documentation
----------------------

Detailed documentation can be built using sphinx

.. code-block:: none

   $ cd docs
   $ make html

Testing
-------

CMake is required for testing.

.. code-block:: none

   $ cd testing
   $ ctest -S ctest_driver.cmake


Running SlideAtlas
------------------

.. code-block:: shell-session

  $(export SLIDEATLAS_CONFIG_PATH=/home/dhan/projects/slideatlas-config-kitware/localhost/site_slideatlas.py ;  gunicorn -k flask_sockets.worker run_websockets:app -b localhost:8080 --log-level=debug)

To run without websockets support
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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
