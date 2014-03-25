# coding=utf-8

from flask import flash, redirect
from flask.ext.openid import OpenID

from slideatlas import models
from .common import login_user

################################################################################
__all__ = ('register', 'login_google',)

################################################################################
oid = OpenID()


################################################################################
def register(app, blueprint):
    oid.init_app(app)


################################################################################
@oid.loginhandler
@oid.after_login
def login_google(oid_response=None):
    """
    Does the login via OpenID.
    """
    GOOGLE_IDENTITY_URL = 'https://www.google.com/accounts/o8/id'

    if oid.fetch_error():
        flash('OpenId Error: %s' % str(oid.fetch_error()), 'error')
        return redirect('/home')
    elif not oid_response:
        # TODO: add support for 'next' field
        return oid.try_login(GOOGLE_IDENTITY_URL, ask_for=['email', 'fullname']) # 'nickname'
    else:
        # Get user from database
        user, created = models.GoogleUser.objects.get_or_create(email=oid_response.email, auto_save=False)
        if created:
            flash('New Google user account created', 'info')
        else:
            flash('Google user account exists', 'info')

        # Update user properties, in case Google has changed them
        user.full_name = oid_response.fullname
        user.save()

        return login_user(user)
