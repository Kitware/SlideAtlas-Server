# coding=utf-8

from collections import namedtuple

from flask import current_app, flash, redirect
from flask.ext.security.decorators import anonymous_user_required
from flask.ext.security.utils import user_registered
from flask.ext.openid import OpenID

from slideatlas import models
from .common import login_user

################################################################################
__all__ = ()

################################################################################
oid = OpenID()


################################################################################
def register(app, blueprint):
    oid.init_app(app)

    blueprint.add_url_rule(rule='/login/google',
                           endpoint='login_google',
                           view_func=anonymous_user_required(login_google),
                           methods=['GET', 'POST'])

    # TODO: temporary structure until Google login is moved to OAuth
    provider = {
        'is_enabled': lambda: True,
        'endpoint': 'login_google',
        'icon_url': '/static/img/google_32.png',
        'pretty_name': 'Google'
    }
    return namedtuple('GoogleLogin', provider.keys())(**provider)


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
            user_registered.send(current_app._get_current_object(), user=user, confirm_token=None)
            flash('New Google user account created', 'info')
        else:
            flash('Google user account exists', 'info')

        # Update user properties, in case Google has changed them
        user.full_name = oid_response.fullname
        user.save()

        return login_user(user)
