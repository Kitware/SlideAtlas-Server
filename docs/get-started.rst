Gettting started
================

.. include:: ../README.rst
    
Setting up Database
-------------------
A good place to start  is setup mongodb, and restore demo database from backups

The database schema keeps evolving and the restored database might not work out of box,
though DJ will take care that the most recent database is backed up.

Admin database also needs setup, there is create_new_slideatlasdb to start with a template. Otherswise it Configuration

In the long run it should be possible to start from a blank admin databse, create site administrator and
add the availabel database to automatically insert all metadata needed with

