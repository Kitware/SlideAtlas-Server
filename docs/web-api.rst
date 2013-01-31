
Web API Notes
=============

Ultimately this file should become redundant  and the actual documentation of the flask routes should take over

Following set of slides is a very good `Link read <http://lanyrd.com/2012/europython/srzpf/>`_  before discussing this

This application would have a combination of REST and RPC calls. Or maybe rest like calls with few posts involving methods.
Using celery to exececute server side operations it is more logical to use rpc like posts on resources pointed by REST api.

Steps of securing web API
-------------------------
`One reference <http://www.infoq.com/news/2010/01/rest-api-authentication-schemes>`_

`Securing API's <http://www.infoq.com/news/2010/01/rest-api-authentication-schemes>`_

Rest API design thoughts
~~~~~~~~~~~~~~~~~~~~~~~~

Rest API blueprint is established and later `consumed <https://gist.github.com/3005268>`_ in the web templates interface

Items in session (Attachments / Views)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Insert items

   - attachments

         - Upload a new file:
                  PUT /sessions/<sessid>/attachments
         - Insert an already existing attachment
                  PUT /sessions/<sessid>/attachments/<attachmentid>

- Get or Remove Items

    - Get a list
      GET /sessions/<sessid>/attachments
      GET /sessions/<sessid>/views

    - Get an item
      GET /sessions/<sessid>/attachments/<attachid>
      GET /sessions/<sessid>/views/<viewid>

- Modify Items
   Items can be modified directly or indirectly
      PATCH /sessions/<sessid>/attachments/<attachmentid>
      { 'label' : "NEW_NAME"}

      PATCH /sessions/<sessid>/views/<viewid>
      { 'label' : "NEW_NAME"}

      PATCH /views/<viewid>
      { 'label' : "NEW_NAME"}

Administrative database
~~~~~~~~~~~~~~~~~~~~~~~
- Resources for administrative interface are "database", "rule", "user"
- Since the final destination {_id} of the resource is not known to calling rest API POST operation is used
- All queries return empty list when used with GET or 403
- Resources will return 40X depending on the error
- There could be a generic API for

- GET

   - /databases/<databaseid>
   - /databases?dbname=<databasename>
   - /rules?facebook_group=<facebookid>
   - /rules/<ruleid>

- POST

   - Add new rule or database or user
   - A custom validate method over generic object schema checking

      - Whether the database with that dbname exists (and is it slideatlas database)
      - Whether the rule existed

- DELETE operations for specific users, a deep delete to also remove all the rules associated with the user

More pending use cases
~~~~~~~~~~~~~~~~~~~~~~

Upload attachments Selecing multiple files from a folder and initiate upload for a particular session (a named session is created if not specified)
-

Authentication (login) operations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- A user session can be created by either sending an json request or by logging into page which sends out a json request to the api.

- / Home page
   - login form
   - Information on what this site is about

- / login
   - &type=google
   - &type=facebook
   - &type=openid
   - &type=password


Session and images
~~~~~~~~~~~~~~~~~~

-  sessions/<sessid>
   - &rename=<new-label>


- /sessions/<sessid>
   - &grant=<new-label>

   - /  Gets a list of all sessions  for the logged in user can see

Viewing image
~~~~~~~~~~~~~
- Main image view with annotation management

- /glviewer/<viewid>
   - ?viewid=<viewid>
   - &dbid = <dbid>

   /olviewer?viewid=<viewid>
   - ?viewid=<viewid>
   - &dbid = <dbid>

TODO: Probably the img appears only in one database, and so dbid could be resolved internally / stored in viewid

Versioing
~~~~~~~~~

- Implement in a blueprint so that the url-prefix makes it easy to rename
- Do some validation in individual case, determine what the user should be able to query and then use common helper
   python routines to get the data


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


