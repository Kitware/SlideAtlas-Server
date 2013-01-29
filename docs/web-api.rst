
Web API (just notes till now)
=============================

Ultimately this file should become redundant  and the actual documentation of the flask routes should take over

Following set of slides is a very good `Link read <http://lanyrd.com/2012/europython/srzpf/>`_  before discussing this


Steps of securing web API
-------------------------
http://www.infoq.com/news/2010/01/rest-api-authentication-schemes

Uploader features
~~~~~~~~~~~~~~~~~

- Point to a folder and queue the uploader
- Upload as soon as they are available

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
   - user
   - session
   - view

Session
-------

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


