.. _plugins:

Plugins
=======

Slideatlas plugins are like flask extensions that are optionally loaded with gl-viewer

During startup
--------------

- Plugins are enabled through site_slideatlas configuration file
- If enabled

    - Load the javascript for the plugins
    - Insert the menu which activates the plugin
    - Register that blue print, which loads corresponding app endpoints


Measurement of scar ratio
-------------------------

Allows interactive threshoding in HSV space, followed by sample morphological operations, each time counting the selected pixels.

Dependence on python modules opencv2 and matplotlib.

OpenCV does not build and install with pip. Hence the suggest procedure right now is -

- Install numpy and matplotlib using pip (this might also need some dependencies globally installed)

- Build opencv from git repository manually and install globally. Copy cv2.so from the built binaries to virtualenbv/lib/python2.7 and everything works as expected


iPython integration
-------------------

IPython is an interactive shell for the Python programming language that offers
enhanced introspection, additional shell syntax, tab completion and rich
history.

This plugin streamlines the process for scientists to experiment with python based image processing pipelines on images stored in SlideAtlas.

The plugin includes a customized profile for ipython notebook, which is aware of SlideAtlas, it makes it easy to login to SlideAtlas and navigate to desired view, and grab that image (snapshot) available in ipython for processing. 

This plugin also includes few enrichments to iPython experience like showing pictorial representation of PIL (python imaging library) Images or numpy arrays directly in the browser after the cells are executed.



A typical developer workflow is described below

Get the SlideAtlas source code
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: shell-session

    $ cd git clone git@github.com:SlideAtlas/SlideAtlas-Server.git
    $ cd SlideAtlas-Server
    $ cd slideatlas/plugins/ipython


Install the dependencies
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Currently the plugin source includes requirements.txt which includes minimum python packages required to start iPython notebook interface interface. 

For ubuntu Few system packages are needed before pip can do its magic.

.. code-block:: shell-session

    $ sudo apt-get install git-core python-pip python-dev
    $ git clone http://github.com/SlideAtlas/SlideAtlas-Server.git
    $ cd SlideAtlas-Server/slideatlas/plugins/ipython
    $ sudo pip install -r requirements.txt
    $ ipython notebook

This starts an ipython notebook, which can be accessed from the `http://localhost:8888 <http://localhost:8888>`_ 

.. warning::
    For using the "update current view" mechanism, the SlideAtlas site must be deployed with latest version

    .. code-block :: python

        slideatlas_load("http://slide-atlas.org/")

.. note::

    For development, the local installation of SlideAtlas may be started



Developer environment
~~~~~~~~~~~~~~~~~~~~~

Here is an example for developer environment for python.

For developers they can install other packages to their python distribution like simpleitk etc for intended processing.

- numpy (sudo pip install numpy)
- matplotlib (sudo pip install matplotlib)
- SimpleITK (sudo easy_install -U SimpleITK)

OpenCV is installed using apt-get as it needs to install and is not easily contained in a virtual environment is depends on the installed opencv2 libraries and is not 

- opencv2 (sudo apt-get install python-opencv)


