# coding=utf-8

from flask import redirect
from flask.ext.security import login_user as flask_login_user
from flask.ext.security.utils import get_post_login_redirect

################################################################################
__all__ = ('login_user',)


################################################################################
def login_user(user):
    flask_login_user(user, False)  # sets "session['user_id']"

    # if a 'next' parameter is in the request, that will be redirected to instead of the default
    return redirect(get_post_login_redirect())
