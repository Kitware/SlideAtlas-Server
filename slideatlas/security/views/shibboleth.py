# coding=utf-8

from flask import abort, current_app, flash, request, url_for
from flask.ext.login import user_logged_out
from flask.ext.security.utils import get_url, user_registered
from werkzeug.datastructures import MultiDict

from slideatlas import models
from .common import login_user

################################################################################
__all__ = ('register', 'login_shibboleth',)

################################################################################
def register(app, blueprint):
    user_logged_out.connect(on_logout_shibboleth, app)


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
        user_registered.send(current_app._get_current_object(), user=user, confirm_token=None)
        flash('New Shibboleth user account created', 'info')
    else:
        flash('Shibboleth user account exists', 'info')

    # Update user properties, in case Shibboleth has changed them
    user.email = email
    user.full_name = display_name
    user.save()

    return login_user(user)


################################################################################
def on_logout_shibboleth(app, user, **kwargs):
    """
    Alters a Shibboleth user's logout request to redirect to the Shibboleth
    handler to do a logout there too.
    """
    if isinstance(user, models.ShibbolethUser):
        # the URL that Flask-Security would have redirected to
        post_logout_url = get_url(app.extensions['security'].post_logout_view)

        # make this request's 'args' mutable; this works because the signal is
        #   sent and processed before the 'logout' view checks its request's args;
        #   however, this behavior is not guaranteed in future versions, so this
        #   could break in the future
        request.parameter_storage_class = MultiDict

        # Flask-Security looks for the 'next' query string parameter to override
        #   the default post_logout redirect location
        # Shibboleth's Logout handler looks for the 'return' query string
        #   parameter for a location to redirect to
        request.args['next'] = url_for('.login_shibboleth_handler',
                                       handler='Logout', # this is an expected parameter
                                       **{'return': post_logout_url}) # 'return' is a Python keyword
