
Web API
=======

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

- / Home page

   - login form
   - Information on what this site is about

- / login
   - &type=google
   - &type=facebook
   - &type=openid
   - &type=password


Session management
~~~~~~~~~~~~~~~~~~

- / sessions
   - &sess=<id>
   - /  Gets a list of all sessions  for the logged in user can see

- Main image view with annotation management
   - &id=<id>
   - &db=<db>

Access management
~~~~~~~~~~~~~~~~~

- / get
   - &id=<id> Get specifc user

- / getlist


