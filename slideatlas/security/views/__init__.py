# coding=utf-8

from .common import OAuthLogin
from . import google
from .facebook import FacebookOAuthLogin
from .linkedin import LinkedinOAuthLogin
from .shibboleth import ShibbolethLogin

################################################################################
__all__ = ('add_views',)


################################################################################
def add_views(app, blueprint):

    # TODO: error handlers can only be registered on a blueprint before the
    #   blueprint has been registered with the app for the very first time; this
    #   error handler should be blueprint-scope, but Flask-Security creates and
    #   registers the blueprint before we have access to it at all; so instead,
    #   register it with the whole app
    # blueprint.errorhandler(OAuthLogin.AuthorizationError)(OAuthLogin.AuthorizationError.handler)
    app.register_error_handler(OAuthLogin.AuthorizationError, OAuthLogin.AuthorizationError.handler)

    login_providers = [
        FacebookOAuthLogin(app, blueprint),
        google.register(app, blueprint),
        LinkedinOAuthLogin(app, blueprint),
        ShibbolethLogin(app, blueprint),
    ]

    # Add login providers to 'login' template context
    security = app.extensions['security']
    security.login_context_processor(lambda: dict(login_providers=login_providers))

    # TODO: password change page

    # TODO: add view for and update profile.html template

    # the blueprint was updated, so it must be re-registered
    app.register_blueprint(blueprint)
