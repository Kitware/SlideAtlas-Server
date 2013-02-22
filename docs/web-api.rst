
.. meta::
   :http-equiv=refresh: 5

Web API Notes
=============

Ultimately this file should become redundant  and the actual documentation of the flask routes should take over

Following set of slides is a very good `Link read <http://lanyrd.com/2012/europython/srzpf/>`_  before discussing this

This application would have a combination of REST and RPC calls. Or maybe rest like calls with few posts involving methods.
Using celery to exececute server side operations it is more logical to use rpc like posts on resources pointed by REST api.

Steps of securing web API
-------------------------

- `One reference <http://www.infoq.com/news/2010/01/rest-api-authentication-schemes>`_
- `Securing API's <http://www.infoq.com/news/2010/01/rest-api-authentication-schemes>`_

Rest API v1 design thoughts
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Rest API blueprint is established and later `consumed <https://gist.github.com/3005268>`_ in the web templates interface

Two kinds API for two kinds of database types. those in image database, and those in administrative database
Those in image database require a database id (to locate the database) in each request

A common decorator to check the access
post and put operations require admin access to the database


Versioing
~~~~~~~~~

- Implement in a blueprint so that the url-prefix makes it easy to rename
- Do some validation in individual case, determine what the user should be able to query and then use common helper
   python routines to get the data

 **'important'**

All the queries are prefixed by apiv1


i.e. to get a list of databases -

.. code-block:: none

   localhost:27017/apiv1/databases 
      
Items in session (Attachments / Views)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To read user has read access to session. It is easiest at this point to put can_see / can_admin information
in the cookie session, other alternatives are to evaluate that information every time

- Insert items for example attachments

   - attachments
         - Upload a new file:
                  POST /<dbid>/sessions/<sessid>/attachments
         - Insert an already existing attachments
                  PUT /<dbid>/sessions/<sessid>/attachments/<attachmentid>

- Get or Remove Items

    - Get a list of session items

.. code-block:: none

      GET /<dbid>/sessions/<sessid>/attachments
      GET /<dbid>/sessions/<sessid>/views
      GET /<dbid>/sessions/<sessid>/rawfiles

    - Get an item
      GET /<dbid>/sessions/<sessid>/attachments/<attachid>
      GET /<dbid>/sessions/<sessid>/views/<viewid>
      GET /<dbid>/sessions/<sessid>/rawfiles/<fileid>

- Modify Items
   Items can be modified directly or indirectly

.. code-block:: none

      PATCH /<dbid>/sessions/<sessid>/attachments/<attachmentid>
      { 'label' : "NEW_NAME"}

      PATCH /<dbid>/sessions/<sessid>/views/<viewid>
      { 'label' : "NEW_NAME"}

      PATCH /<dbid>/views/<viewid>
      { 'label' : "NEW_NAME"}

Administrative database
~~~~~~~~~~~~~~~~~~~~~~~
- Resources for administrative interface are "database", "rule", "user"
- Since the final destination {_id} of the resource is not known to calling rest API POST operation is used
- All queries return empty list when used with GET or 403
- Resources will return 40X depending on the error
- There could be a generic API for

Administrative access is required to any queries dealing directly with administrative database

.. code-block:: none

   - GET
      - /databases/<databaseid>
      - /databases?dbname=<databasename>
      - /rules?facebook_group=<facebookid>
      - /rules/<ruleid>

- Add new rule or database or user
- A custom validate method over generic object schema checking

   - Whether the database with that dbname exists (and is it slideatlas database)
   - Whether the rule existed

.. code-block:: none

   - POST

operations for specific users, a deep delete to also remove all the rules associated with the user

.. code-block:: none

   - DELETE 

High level API to manage access rights
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get a list of registered facebook groups

.. code-block:: none

   GET /apiv1/facebook-groups
   
   POST /apiv1/facebook-groups/<facebook-group-id>
   {'dbid' : '<dbid>', can_see' : [ '<sessionid>', ... ]}
   {'dbid' : '<dbid>', 'can_see_all' : [ '<sessionid>', ... ]}
   
   
More pending use cases
~~~~~~~~~~~~~~~~~~~~~~

Upload attachments Selecing multiple files from a folder and initiate upload for a particular session (a named session is created if not specified)
-

Authentication (login) operations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- A user session can be created by either sending an json request or by logging into page which sends out a json request to the api.

.. code-block:: none

   - / Home page
      - login form
      - Information on what this site is about
   
   - / login
      - &type=google
      - &type=facebook
      - &type=openid
      - &type=password

Few access rights are calculated at the time of login. Hence if the access rights are
calculated while the user is logged in the user must logout and login again to see the effect.


Session and images
~~~~~~~~~~~~~~~~~~

-  sessions/<sessid>
   - &rename=<new-label>


- /sessions/<sessid>
   - &grant=<new-label>

   - /  Gets a list of all sessions  for the logged in user can see

Viewing and other pages
~~~~~~~~~~~~~~~~~~~~~~~
- Main image view with annotation management

- /glviewer/<viewid>
   - ?viewid=<viewid>
   - &dbid = <dbid>

   /olviewer?viewid=<viewid>
   - ?viewid=<viewid>
   - &dbid = <dbid>

TODO: Probably the img appears only in one database, and so dbid could be resolved internally / stored in viewid


Generic resources
~~~~~~~~~~~~~~~~~

- Getting the information, here "user" is used, and can be replaced by any generic resource

User
----

View
----
GET
- /view/<viewid>
PATCH
- /view/<viewid>



Session
-------
Session is special as it contains list of views internally

GET (Get the information)
- /user/<userid>

      - &id=<id> Get specifc user

PUT (Update the information)
- /user/<userid>

      - &id=<id> Get specifc user

POST
- /user/<userid>

   - &id=<id> Get specifc user

- / getlist


