# coding=utf-8

from flask.ext.security.decorators import anonymous_user_required

from . import google
from . import facebook
from . import shibboleth

################################################################################
__all__ = ('add_views',)


################################################################################
def add_views(app, blueprint):
    blueprint.add_url_rule(rule='/login/google',
                           view_func=anonymous_user_required(google.login_google),
                           methods=['GET', 'POST'])
    google.register_with_app(app)

    blueprint.add_url_rule(rule='/login/facebook',
                           view_func=anonymous_user_required(facebook.login_facebook),
                           methods=['GET'])
    blueprint.add_url_rule(rule='/login/facebook/authorized',
                           view_func=anonymous_user_required(facebook.login_facebook_authorized),
                           methods=['GET'])
    facebook.register_with_app(app)

    blueprint.add_url_rule('/login.shibboleth/<path:handler>',
                           endpoint='login_shibboleth_handler',
                           build_only=True)
    blueprint.add_url_rule('/login/shibboleth',
                           view_func=anonymous_user_required(shibboleth.login_shibboleth),
                           methods=['GET'])

    # TODO: password change page

    # TODO: add view for and update profile.html template

    # the blueprint was updated, so it must be re-registered
    app.register_blueprint(blueprint)
