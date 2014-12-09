# coding=utf-8

import copy

from flask import Markup, url_for
from flask.ext.security import Security, MongoEngineUserDatastore, user_registered
from flask.ext.security.core import _SecurityState
from flask.ext.security.core import _context_processor as security_default_context_processor
from flask.ext.security.views import create_blueprint as security_create_blueprint
from flask.ext.security.views import send_confirmation as security_send_confirmation
from flask.ext.security.utils import send_mail

from slideatlas import models
from . import forms, views, login_provider
from .principal import register_principal

################################################################################
__all__ = ('blueprint', 'register_with_app')


################################################################################
def register_with_app(app):
    add_config(app)

    security, blueprint = create_security(app)

    register_principal(app, security)

    login_provider.add_views(app, blueprint)

    # TODO: move the 'site_url' value to config file
    security.mail_context_processor(lambda: dict(site_url='https://slide-atlas.org/'))

    # TODO: make logins timeout
    #   may use the 'flask.ext.login.user_loaded_from_*' signals for this, to update the timeout
    #   furthermore, see the documentation 'flask.ext.login.needs_refresh', and implement re-login
    #   redirection directly to the user's corresponding login provider if a user's session becomes stale

    user_registered.connect(on_user_registered, app)


################################################################################
# TODO: find a way of automatically registering Shibboleth users with the
#   appropriate group, similar to facebook_id
def on_user_registered(app, user, confirm_token):
    if isinstance(user, models.ShibbolethUser) or user.email.endswith('brown.edu'):
        brown_group = models.Group.objects.with_id('529d244959a3aee20f8a00ae')
        user.groups.append(brown_group)
        user.save()

    send_mail(
        'SlideAtlas: New User Registered',
        app.config['SLIDEATLAS_ADMIN_EMAIL'],
        'new_user_notify',
        user=user,
        admin_user_url=url_for('%sview.edit_view' % user.__class__.__name__.lower(),
                               id=str(user.id),
                               _external=True)
    )


################################################################################
def add_config(app):
    """
    Set Flask application configuration options.

    These are options that should never change.
    """
    # Flask-Security configuration
    app.config.update(
        ### Frontend ###
        SECURITY_FLASH_MESSAGES=True,
        SECURITY_LOGIN_URL='/login',
        SECURITY_LOGIN_USER_TEMPLATE='security/login.html',
        SECURITY_MSG_DISABLED_ACCOUNT=('Password login is disabled for this account.', 'error'),
        SECURITY_LOGOUT_URL='/logout',
        # TODO: change '/sessions' to an endpoint name
        SECURITY_POST_LOGIN_VIEW='/sessions',
        SECURITY_POST_LOGOUT_VIEW='home',

        ### Password login options ###
        SECURITY_DEFAULT_REMEMBER_ME=False,

        ## New account registration
        SECURITY_REGISTERABLE=True,
        SECURITY_REGISTER_URL='/login/password/register',
        SECURITY_REGISTER_USER_TEMPLATE='security/register.html',
        SECURITY_SEND_REGISTER_EMAIL=True,
        SECURITY_EMAIL_SUBJECT_REGISTER='SlideAtlas: Account Created',
        # uses 'welcome' email body template
        # TODO: change the email body template, as the default contains a password confirmation link, and we want non-password users to receive a welcome email too

        ## Confirmation of user's email address
        SECURITY_CONFIRMABLE=True,
        SECURITY_CONFIRM_URL='/login/password/confirm',
        SECURITY_SEND_CONFIRMATION_TEMPLATE='security/resend_confirmation.html',
        SECURITY_EMAIL_SUBJECT_CONFIRM='SlideAtlas: Account Confirmation',
        # uses 'confirmation_instructions' email body template
        SECURITY_CONFIRM_EMAIL_WITHIN='5 days',
        SECURITY_LOGIN_WITHOUT_CONFIRMATION=False,
        SECURITY_MSG_EMAIL_CONFIRMED=(
            Markup(
                'Welcome to SlideAtlas! Your account has been confirmed.<br>'
                '<br>'
                'Site administrators may now grant you access to additional content. '
                'You can also contact <a href="mailto:%(email)s">%(email)s</a> with any requests.' %
                    {'email': app.config['SLIDEATLAS_ADMIN_EMAIL']}
            ),
            'success'),

        ## Recover / reset a lost password
        SECURITY_RECOVERABLE=True,
        SECURITY_RESET_URL='/login/password/reset',
        SECURITY_FORGOT_PASSWORD_TEMPLATE='security/password_reset_1.html',  # step 1
        SECURITY_RESET_PASSWORD_TEMPLATE='security/password_reset_2.html',  # step 2
        SECURITY_EMAIL_SUBJECT_PASSWORD_RESET='SlideAtlas: Password Reset Instructions',
        # uses 'reset_instructions' email body template
        SECURITY_RESET_PASSWORD_WITHIN='5 days',
        SECURITY_SEND_PASSWORD_RESET_NOTICE_EMAIL=False,  # TODO: do we want to send a confirmation email?
        SECURITY_EMAIL_SUBJECT_PASSWORD_NOTICE='SlideAtlas: Password Reset Successful',
        # uses 'reset_notice' email body template

        ## Change a password
        SECURITY_CHANGEABLE=True,
        SECURITY_CHANGE_URL='/login/password/change',
        SECURITY_CHANGE_PASSWORD_TEMPLATE='security/password_change.html',
        SECURITY_SEND_PASSWORD_CHANGE_EMAIL=False,  # TODO: do we want to send a confirmation email?
        SECURITY_EMAIL_SUBJECT_PASSWORD_CHANGE_NOTICE='SlideAtlas: Password Change Successful',
        # uses 'change notice' email body template

        ### Other options ###
        SECURITY_TRACKABLE=True,  # record login statistics in User model
        SECURITY_PASSWORDLESS=False,  # an experimental feature
        # custom salts can also be set for several other tokens, but this shouldn't be necessary

        # TODO: there are a few other undocumented config settings in Flask-Security, explore them
    )

    # Flask-Login configuration
    app.config.update(
        SESSION_PROTECTION='basic',  # some extra security for cookies, see documentation for details

        REMEMBER_COOKIE_DOMAIN=app.session_interface.get_cookie_domain(app),

        REMEMBER_COOKIE_HTTPONLY=True,

        REMEMBER_COOKIE_SECURE=app.config['SLIDEATLAS_HTTPS'],
    )


################################################################################
def create_security(app):
    # register Flask-Security with app and get blueprint
    security = Security(app, SlideatlasMongoEngineUserDatastore(),
                        register_blueprint=False,
                        confirm_register_form=forms.RegisterForm,
                        login_form=forms.LoginForm)

    # prevent Flask-Security from automatically creating register and confirm views
    #   by calling 'security_create_blueprint' with a different state
    security_blueprint_state = copy.copy(security._state)
    security_blueprint_state.registerable = False
    security_blueprint_state.confirmable = False
    blueprint = security_create_blueprint(security_blueprint_state, 'flask_security.core')

    # add SlideAtlas's own register view, which doesn't immediately require a password
    blueprint.add_url_rule(security.register_url,
                           endpoint='register',
                           view_func=views.register,
                           methods=['GET', 'POST'])
    # use the Flask-Security's built-in view for re-sending a confirmation, which
    #   needs to be manually added, since 'confirmable' was set to False
    blueprint.add_url_rule(security.confirm_url,
                           endpoint='send_confirmation',
                           view_func=security_send_confirmation,
                           methods=['GET', 'POST'])
    # add SlideAtlas's own confirm view, which requires the user to set a password
    blueprint.add_url_rule(security.confirm_url + '/<token>',
                           endpoint='confirm_email',
                           view_func=views.confirm_email,
                           methods=['GET', 'POST'])

    # do work that Flask-Security would have done if 'register_blueprint' were True
    app.register_blueprint(blueprint)
    app.context_processor(security_default_context_processor)

    return security, blueprint


################################################################################
class SlideatlasMongoEngineUserDatastore(MongoEngineUserDatastore):
    def __init__(self):
        # 'db' parameter is not necessary for this subclass
        super(SlideatlasMongoEngineUserDatastore, self).__init__(None, models.User, None)
        self.user_creation_model = models.PasswordUser

    def create_user(self, **kwargs):
        """Creates and returns a new user from the given parameters."""
        user = self.user_creation_model(**kwargs)
        return self.put(user)
