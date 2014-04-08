# coding=utf-8

################################################################################
## Database Settings ##

SLIDEATLAS_ADMIN_DATABASE_HOST = 'localhost:27017'
""" The hostname and port of the MongoDB SlideAtlas admin database. """

SLIDEATLAS_ADMIN_DATABASE_REPLICA_SET = None
""" The name of the replica set for the admin database, if it is a member of one,
or None otherwise. """

SLIDEATLAS_ADMIN_DATABASE_NAME = 'slideatlas'
""" The MongoDB database name of the admin database. """

SLIDEATLAS_ADMIN_DATABASE_USERNAME = None
""" The username to authenticate to the admin database with, if any. """

SLIDEATLAS_ADMIN_DATABASE_PASSWORD = None
""" The password to authenticate to the admin database with, if any. """

SLIDEATLAS_ADMIN_DATABASE_AUTH_DB = None
""" The database name to authenticate to the admin database with, if any. """


################################################################################
## Cryto Settings ##

SECRET_KEY = b'WRa/y5PVGdFNoaEfgoBENdUm9IYPs5DW'
""" A random value used for signing cookies and other cryptographic
operations.

This should always be changed when setting up a production instance.

A simple cross-platform PRNG is to run the command:
  python2 -c 'import os; print repr(str(os.urandom(24)).encode("base64").rstrip())'
"""

SECURITY_PASSWORD_HASH = 'pbkdf2_sha512'
""" Specifies the password hash algorithm to use when encrypting user
passwords.

Recommended values for production systems are 'bcrypt', 'sha512_crypt', or
'pbkdf2_sha512'. 'plaintext' is also possible, but not recommended. """

SECURITY_PASSWORD_SALT = '6IRWyQdC19raLaJf/Lm6gAfmMleXlO7i'
""" A random value, used as the salt when hashing passwords.

This does not apply if the password hash type is 'plaintext'. """


################################################################################
## Facebook OAuth Settings ##

SLIDEATLAS_FACEBOOK_APP_ID = None
""" The Facebook App ID (OAuth client ID) used for Facebook user
authentication. """

SLIDEATLAS_FACEBOOK_APP_SECRET = None
""" The Facebook App secret (OAuth client secret) used for Facebook user
authentication. """


################################################################################
## LinkedIn OAuth Settings ##

SLIDEATLAS_LINKEDIN_APP_ID = None
""" The LinkedIn App ID (OAuth client ID) used for LinkedIn user
authentication. """

SLIDEATLAS_LINKEDIN_APP_SECRET = None
""" The LinkedIn App secret (OAuth client secret) used for LinkedIn user
authentication. """


################################################################################
## Shibboleth Login Settings ##

SLIDEATLAS_SHIBBOLETH = False
""" Whether Shibboleth login is available. """


################################################################################
## App URL Settings ##

SLIDEATLAS_HTTPS = False
""" Whether the app is being served over HTTPS. """

SERVER_NAME = None
""" The name and port number of the server.

Required for subdomain support (e.g.: 'myapp.dev:5000'). Note that
localhost does not support subdomains, so setting this to “localhost”
does not help. """

APPLICATION_ROOT = None
""" The root of the application in the URL path. (None defaults to '/')

If the application does not occupy a whole domain or subdomain this can be
set to the path where the application is configured to live. This is for
session cookie as path value. If domains are used, this should be None. """


################################################################################
## Email Settings ##

MAIL_SERVER = 'localhost'
""" The hostname of the SMTP server to send email via. """

MAIL_PORT = 25
""" The port to connect to the SMTP server with. """

MAIL_USE_TLS = False
""" Connect to the SMTP server using TLS. """

MAIL_USE_SSL = False
""" Connect to the SMTP server using SSL. """

MAIL_USERNAME = None
""" The user name to authenticate to the SMTP server with. """

MAIL_PASSWORD = None
""" The password to authenticate to the SMTP server with. """

SECURITY_EMAIL_SENDER = 'no-reply@localhost'
""" The email address to send emails as. """

MAIL_MAX_EMAILS = None
""" The maximum number of emails to send before reconnecting.

Some mail servers set a limit on the number of emails sent in a single
connection. """


################################################################################
## Development Settings ##

DEBUG = False
""" Enable Flask's debug mode. """

TESTING = False
""" Enable Flask's testing mode. """

LOGIN_DISABLED = False
""" Disable login and role requirement access controls. """

TRAP_HTTP_EXCEPTIONS = False
""" If this is set to True Flask will not execute the error handlers of HTTP
 exceptions but instead treat the exception like any other and bubble it
 through the exception stack. """

MAIL_DEBUG = False
""" Set the email debug output level.

A non-false value results in debug messages for connection and for all
messages sent to and received from the SMTP server. """

MAIL_SUPPRESS_SEND = False
""" Prevent emails from actually being sent. """


################################################################################
## Cookie Settings ##

SESSION_COOKIE_NAME = 'session'
""" The name of the session cookie. """

REMEMBER_COOKIE_NAME = 'remember_token'
""" The name of the remember user cookie. """
