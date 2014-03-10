# coding=utf-8

from flask import abort, flash, request
from flask.ext.openid import OpenID

from slideatlas import models
from .common import login_user

################################################################################
__all__ = ('login_shibboleth',)


################################################################################
def login_shibboleth():
    # this could be set by other CGI-compatible auth methods, but is a quick
    # check to ensure Shibboleth protection is enabled
    if not request.environ.get('Shib-Application-ID'):
        abort(503)  # Service Unavailable

    eppn = request.environ.get('Shib-Attribute-eduPersonPrincipalName')
    email = request.environ.get('Shib-Attribute-mail')
    display_name = request.environ.get('Shib-Attribute-displayName')

    if not eppn:
        abort(401)  # Unauthorized

    user, created = models.ShibbolethUser.objects.get_or_create(eppn=eppn)

    if created:
        flash('New Shibboleth user account created', 'info')
    else:
        flash('Shibboleth user account exists', 'info')

    # Update user properties, in case Shibboleth has changed them
    user.email = email
    user.full_name = display_name
    user.save()

    return login_user(user)
