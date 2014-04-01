.. Slideatlas Tileserver documentation master file, created by
   sphinx-quickstart on Wed Mar 26 12:31:40 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Slideatlas Tileserver's documentation!
=================================================

Contents:

.. toctree::
   :maxdepth: 2


Workflow for Phillips images
============================

- Images get to wsgiserver2
- When a url is called, a function will update the mongodb if now in sync


Organizing mongodb metadata (images collection)
===============================================

- Parse a directory and create an images collection
- Keeping a mongodb collection synchronized with the files in a location
- When a view is fetched, it comes with a special parameter called *tile_prefix*

Abstracting the store
=====================

- A database object A tile store could be file based
- Define


Specification for proc parameters

::

    proc=gain:<sharpening>,clip:<contrast>,gamma:<gamma>,boff:<BlackLevel>,woff:<WhiteLevel>




Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

