# coding=utf-8

import os

from flask import flash, redirect, session, url_for
from flask.ext.security import login_user as flask_login_user
from flask.ext.security.utils import get_post_login_redirect
from flask.ext.oauthlib.client import OAuth
from werkzeug.security import gen_salt

################################################################################
__all__ = ('oauth', 'OAuthAuthorizationError', 'login_user', 'push_oauth_state', 'pop_oauth_state')

################################################################################
oauth = OAuth()


################################################################################
class OAuthAuthorizationError(Exception):
    oauth_service = 'OAuth'

    def __init__(self, message='', status_code=500):
        self.message = message
        self.status_code = status_code
        super(OAuthAuthorizationError, self).__init__(str(self))

    def __unicode__(self):
        return unicode('%s access denied: %s' % (self.oauth_service, self.message))

    def __str__(self):
        return unicode(self).encode('utf-8')

    @staticmethod
    def handler(error):
        flash(str(error), 'error')
        return redirect(url_for('.login'), code=error.status_code)


################################################################################
def login_user(user):
    flask_login_user(user, False)  # sets "session['user_id']"

    # if a 'next' parameter is in the request, that will be redirected to instead of the default
    return redirect(get_post_login_redirect())


################################################################################
def push_oauth_state():
    """
    Create, store, and return a random string.

    Used by OAuth to prevent CSRF.
    """
    state = gen_salt(10)
    session['oauth_state'] = state
    return state

def pop_oauth_state():
    """
    Pop and return a stored random string.

    Used by OAuth to prevent CSRF.
    """
    return session.pop('oauth_state', None)
