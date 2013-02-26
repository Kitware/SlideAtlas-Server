
.. meta::
   :http-equiv=refresh: 5

Web API
=======

Ultimately this file should become redundant  and the actual documentation of the flask routes should take over

Following set of slides is a very good `Link read <http://lanyrd.com/2012/europython/srzpf/>`_  before discussing this

This application would have a combination of REST and RPC calls. Or maybe rest like calls with few posts involving methods.
Using celery to exececute server side operations it is more logical to use rpc like posts on resources pointed by REST api.

References for `securing web API's <http://www.infoq.com/news/2010/01/rest-api-authentication-schemes>`_

- Implement in a blueprint so that the url-prefix makes it identifies diferent versions
- Do some validation in every request, i.e. determine if the user is logged in and what can be queried and then use common helper
   python routines to get and serve the data

Rest API v1
~~~~~~~~~~~

 **important**

All the queries in version 1 are prefixed by apiv1

i.e. to get a list of databases -

.. code-block:: none

   localhost:8080/apiv1/databases 

Rest API blueprint is established and later `consumed <https://gist.github.com/3005268>`_ in the web templates interface.

Two kinds API for two kinds of database types. those in image database, and those in administrative database.
Those in image database require a database id (to locate the database) in each request.

A common decorator to check the access @user_required, and @site_admin required implemented so far.

Put requests are used for putting entities e.g. file where the destination is known. POST requests are used for posting
new resources, in particular complete objects. When partial modifications are to be made, PATCH command is used..

TODO: there should be a common place for access information computation about the sessions.
This will improve the performance of the each reqeust.

Sessions
--------

A session is smallest unit for which an access can be granted or revoked. It contains lists of useful items like

- Raw images (that are to be processed internally)
- Views of images
- Downloadable file attachments, that are simply stored.

A list of sessions in a known databaseid is obtained by -

.. code-block:: none

      GET /apiv1/<dbid>/sessions

The main use case of this list is to display selectable sessions with the access rights to the user that is logged in
So the view, attachments and etc lists are not included.

New sessions can be posted here

.. code-block:: none

   POST /apiv1/<dbid>/sesisons
   { 'insert: { 'label' : "label string }}

returns the newly inserted session object with empty views and attachments lists

A particular session is obtained by

.. code-block:: none

   GET /apiv1/<dbid>/sessions/<sessid>
      
The main use case of this is to present the session to the user.  So this does contain all the lists.

.. note::

   TODO: Thinking of dereferencing views and attachments so enough information to display them is presented.
   

or is deleted by

.. code-block:: none

   DELETE /apiv1/<dbid>/sessions/<sessid>

.. warning::

   This call presently works only if the session i.e. the lists of items in it are completely empty.    
   If an attempt is made to delete a non-empty session, an error will be returned. 
   This will change when management of orphan items is implemented.

.. note::
   **Following are thoughts**

   A particular session contains other items. So the question comes
   what happens to the items in the session when the session is removed.
   
   Current thought is to move all the items (references to a orphan session)
   which is displayed only to administrators.

   Possibly implement a recursive delete call by

   .. code-block:: none
      
      POST /apiv1/<dbid>/sessions/<sessid>
      {purge : ["images", "attachments", "raw-files"]}

Modifying the properties of the session are made possible by

.. code-block:: none

   POST /apiv1/<dbid>/sesisons
   { 'insert: { 'label' : "label string }}


Items in session (Attachments / Views)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A list of the items can be obtaied by

.. code-block:: none

      GET /<dbid>/sessions/<sessid>/attachments
      GET /<dbid>/sessions/<sessid>/views
      GET /<dbid>/sessions/<sessid>/rawfiles

Later can be generalized to any list

.. code-block:: none

      GET /<dbid>/sessions/<sessid>/<listname>
      
To get or delete items

.. code-block:: none

      DELETE /<dbid>/sessions/<sessid>/attachments/<attachid>
      DELETE /<dbid>/sessions/<sessid>/views/<viewid>
      DELETE /<dbid>/sessions/<sessid>/rawfiles/<fileid>

Uploading attachments or raw files, first a POST request should be made make a post request to get a new _id, and then upload the file to that _id. That _id
will be the _id in gridfs

.. code-block:: none

   POST /apiv1/<dbid>/sessions/attachments
   
returns a new _id.

.. code-block:: none

   {'_id' : <ObjectId>}

So in the following request And in the following PUT request(s) file chunks are uploaded. see the code for details

.. code-block:: none

   PUT /apiv1/<dbid>/sessions/attachments/<fileid>
   {'_id' : <ObjectId>}

.. warning::

   The ObjectId is not actually inserted in the attachements collection until the file is actually uploaded.
   So it will not be visible as attachment or rawfile until then 


TODO: API for insering views is being designed

Items can be modified directly or indirectly for example renaming

.. code-block:: none

      PATCH /apiv1/<dbid>/sessions/<sessid>/attachments/<attachmentid>
      { 'label' : "NEW_NAME"}

      PATCH /apiv1/<dbid>/sessions/<sessid>/views/<viewid>
      { 'label' : "NEW_NAME"}
      
Operations like reordering also involve post query

.. code-block:: none

      PATCH /apiv1/<dbid>/sessions/<sessid>/views/<viewid>
      { 'label' : "NEW_NAME"}
      
returns

.. code-block:: javascript

      { 'label' : "NEW_NAME"}

Or in rare cases when position value of all elements needs to be changed in the client side, it returns entire list

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
   
Authentication (login) operations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- A user session can be created by either sending an json request or by logging into page which sends out a json request to the api.

TODO: Rewrite this documentation in the light of new API

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

