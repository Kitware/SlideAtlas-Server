# coding=utf-8

from flask.ext.security.decorators import anonymous_user_required

from .common import OAuthLogin
from . import google
from .facebook import FacebookOAuthLogin
from .linkedin import LinkedinOAuthLogin
from . import shibboleth

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

    # Google
    blueprint.add_url_rule(rule='/login/google',
                           view_func=anonymous_user_required(google.login_google),
                           methods=['GET', 'POST'])
    google.register(app, blueprint)

    # Facebook
    FacebookOAuthLogin(app, blueprint)

    # LinkedIn
    LinkedinOAuthLogin(app, blueprint)

    # Shibboleth
    blueprint.add_url_rule('/login.shibboleth/<path:handler>',
                           endpoint='login_shibboleth_handler',
                           build_only=True)
    blueprint.add_url_rule('/login/shibboleth',
                           view_func=anonymous_user_required(shibboleth.login_shibboleth),
                           methods=['GET'])
    shibboleth.register(app, blueprint)

    # TODO: password change page

    # TODO: add view for and update profile.html template

    # the blueprint was updated, so it must be re-registered
    app.register_blueprint(blueprint)
