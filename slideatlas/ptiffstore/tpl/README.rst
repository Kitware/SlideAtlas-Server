Third Party libraries
=====================

This folder includes two open source packages pre-build for 64 bit linux (ubuntu 12.04 lts).


libtiff
-------

.. code-block::

    curl ftp://ftp.remotesensing.org/pub/libtiff/tiff-4.0.3.tar.gz | tar -xzvf

On linux this builds with jpeg support because of the libjpeg62-dev package installed.

.. note::
    TODO: Cmakify this build so that it builds well on windows

pylibtiff
---------

It depends on the libtiff version mentioned previously

.. code-block::

    svn checkout http://pylibtiff.googlecode.com/svn/trunk/ pylibtiff-read-only