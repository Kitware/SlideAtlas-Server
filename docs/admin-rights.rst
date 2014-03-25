
Administrative roles
####################

Following are the use cases according to different privileges

0 Superuser Site Admin
======================

- Register / Create new databases in slide atlas system
- Grant / revoke level 0 accesses

1 Collaborators or course instructors
=====================================

(Database administrators)

- Get new database of their own
- Grant / revoke level 1 access for their database

2 Trusted user (Like TA or researcher)
======================================

- No quota for uploading
- Grant / revoke level 2 access to the sessions that they can admin

3 Trial users (Content creator Session Admin)
=============================================
**TODO** copyright and fair use issues

- Create sessions
- Upload images / files to their sessions (Quota restrictions, and limited)
- Compose sessions from existing sessions that they have admin access to
- Can grant / revoke level 4 access to others for which they have admin access

4 Common account user
=====================
**depricated**

(Student using password login)

4 Unverified user
=================

(Normal students or friends of trial users)

- Currently only view sessions that are explicitly granted
- Add annotations to any image, make annotations public or share link with others


5 Anonymous user
================

- Currently only view demo sessions


Additional Notes
----------------

Image / file owners always retain admin permission to their content

Currently considering only db_admin, and no admin access rights are implemented
for simplicity.

.. note::

    Anything below this line is slighly outdated and needs to be rewritten



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
