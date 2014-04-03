
Administrative roles
####################

Following are the use cases accordng to different privileges

Site Admin
==========
- Everything that DB admins can do
- Register / Create new databases in slide atlas system
- Grant and revoke DB level admin accesses
- DB to user

DB Admin
========

- Everything that session admins can do
- Create new sessions
- By default admin them
- Grant admin access
- Create and revoke database licenses (see below)

Session Admin
=============

- Upload / delete annotations
- Lead a session
- Set / Change / delete startup view
- Grant view access to this session to
- Groups of users
- specific user
- Create a rule involving this session

No admin
========

- Currently only view access


Additional Notes
----------------

Currently considering only db_admin, and no admin access rights are implemented
for simplicity.

Uploading files
===============

Upload is currently performed using a desktop application. Anyone can download
or share this application  But for security only downloading the application
will not be enough, and every upload should require username and password.

DB administrators own the database, so they can create a user which is in turn
used for uploading.

For now only DB administrators are able to upload content to their database.

Managing MongoDB users
======================

Upload access (in the application) is managed per db in mongodb.

Using web interface , DB administrators request for a new license. License
creation page does following

- Makes sure the user is authorized to create a license
- Creates a random username and passoword for mongodb database
- Creates a license string by encrypting the username and password together
- Once generated the license can be revoked in web interface

The upload utility is able to process the license file to log into the database
to perform upload operation. This key can be shared with any one who they want
to give upload access.

First step uploader utility
---------------------------
Create and test a utility to create random mongodb user The utility accepts an
authenticated connection to the specified database and creates a random
username password and returns the dictionary containing them.

This list should also be added to the databases record in the schema
--------------------------------------------------------------------
Assuming only one (or two) users are going to upload images.

Database specific username, database pairs are created. Database admin can
create / list revoke them.

Reference for cryptographic encryption to secure these is using
`public key encryption <http://www.laurentluce.com/posts/python-and-cryptography-with-pycrypto/#a_3>`_

TODO: Add tests for testing license.


For operation on each DB
