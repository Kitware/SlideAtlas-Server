# coding=utf-8

from flask import request, url_for
from flask.ext.login import user_logged_out
from flask.ext.security.decorators import anonymous_user_required
from werkzeug.datastructures import MultiDict

from slideatlas import models
from .common import LoginProvider

################################################################################
__all__ = ()

################################################################################
class ShibbolethLogin(LoginProvider):

    @property
    def icon_url(self):
        return '/static/img/32px-BrownU-CoA.svg.png'


    @property
    def user_model(self):
        return models.ShibbolethUser


    @property
    def pretty_name(self):
        return 'Brown University'


    @property
    def name(self):
        return 'shibboleth'


    @property
    def endpoint_handler(self):
        return '%s_handler' % self.endpoint


    def __init__(self, app, blueprint):
        super(ShibbolethLogin, self).__init__(app, blueprint)

        if not app.config['SLIDEATLAS_SHIBBOLETH']:
            # self.enabled is False by default
            return

        self.enabled = True

        blueprint.add_url_rule('/login.shibboleth/<path:handler>',
                               endpoint=self.endpoint_handler,
                               build_only=True)
        blueprint.add_url_rule('/login/shibboleth',
                               endpoint=self.endpoint,
                               view_func=anonymous_user_required(self.login_view),
                               methods=['GET'])

        user_logged_out.connect(self.on_logout, app)


    def fetch_person(self):
        return self.Person(
            external_id=request.environ.get('Shib-Attribute-eduPersonPrincipalName'),
            full_name=request.environ.get('Shib-Attribute-mail'),
            email=request.environ.get('Shib-Attribute-displayName')
        )


    def login_view(self):
        # this could be set by other CGI-compatible auth methods, but is a quick
        # check to ensure Shibboleth protection is enabled
        if not request.environ.get('Shib-Application-ID'):
            raise self.AuthorizationError('local Shibboleth service unavailable', 503)  # Service Unavailable

        return self.do_login()


    def on_logout(self, app, user, **kwargs):
        """
        Alters a Shibboleth user's logout request to redirect to the Shibboleth
        handler to do a logout there too.
        """
        if isinstance(user, self.user_model):
            # the URL that Flask-Security would have redirected to
            # the logout handler requires a full absolute URL for its 'return'
            #   parameter, so make it with '_external'
            post_logout_url = url_for(app.extensions['security'].post_logout_view,
                                      _external=True)

            # make this request's 'args' mutable; this works because the signal is
            #   sent and processed before the 'logout' view checks its request's args;
            #   however, this behavior is not guaranteed in future versions, so this
            #   could break in the future
            request.parameter_storage_class = MultiDict

            # Flask-Security looks for the 'next' query string parameter to override
            #   the default post_logout redirect location
            # Shibboleth's Logout handler looks for the 'return' query string
            #   parameter for a location to redirect to
            request.args['next'] = url_for('.%s' % self.endpoint_handler,
                                           handler='Logout', # this is an expected parameter
                                           **{'return': post_logout_url}) # 'return' is a Python keyword
