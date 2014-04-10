# coding=utf-8

from flask.ext.security import Security, MongoEngineUserDatastore, user_registered
from flask.ext.mail import Mail

from slideatlas import models
from . import forms
from .views import add_views

################################################################################
__all__ = ('blueprint', 'register_with_app')


################################################################################
def register_with_app(app):
    add_config(app)

    # register Flask-Security with app and get blueprint
    security = Security(app, SlideatlasMongoEngineUserDatastore(),
                        register_blueprint=True,
                        confirm_register_form=forms.ConfirmRegisterForm,
                        login_form=forms.LoginForm)
    blueprint = app.blueprints['security']

    # register Flask-Mail with app
    Mail(app)
    # TODO: set up a Celery task to send mail asynchronously; this can be integrated
    #   by creating a function that accepts 1 parameter, a flask.exe.mail.Message object,
    #   then passing that function to 'security.send_mail_task(<send_mail_func>)' to register it
    #   see https://pythonhosted.org/Flask-Security/customizing.html#emails-with-celery , but we
    #   would not use a decorator

    add_views(app, blueprint)

    # TODO: move the 'site_url' value to config file
    security.mail_context_processor(lambda: dict(site_url='https://slide-atlas.org/'))

    # TODO: make logins timeout
    #   may use the 'flask.ext.login.user_loaded_from_*' signals for this, to update the timeout
    #   furthermore, see the documentation 'flask.ext.login.needs_refresh', and implement re-login
    #   redirection directly to the user's corresponding login provider if a user's session becomes stale

    user_registered.connect(on_user_registered, app)


################################################################################
# TODO: this is a short term solution until an "everyone" / publicly-viewable
#   role can be implemented
def on_user_registered(app, user, confirm_token):
    demo_role = models.Role.objects.get(name='Atlas Demonstration')
    user.roles.append(demo_role)
    user.save()


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
        SECURITY_LOGOUT_URL='/logout',
        # TODO: change '/sessions' to an endpoint name
        SECURITY_POST_LOGIN_VIEW='/sessions',
        SECURITY_POST_LOGOUT_VIEW='home',

        ### Password login options ###
        SECURITY_DEFAULT_REMEMBER_ME=False,

        ## New account registration
        SECURITY_REGISTERABLE=True,
        SECURITY_REGISTER_URL='/login/password/register',
        SECURITY_REGISTER_USER_TEMPLATE='security/signup.html',
        SECURITY_SEND_REGISTER_EMAIL=True,
        SECURITY_EMAIL_SUBJECT_REGISTER='slide-atlas.org: Account Created',
        # uses 'welcome' email body template
        # TODO: change the email body template, as the default contains a password confirmation link, and we want non-password users to receive a welcome email too

        ## Confirmation of user's email address
        SECURITY_CONFIRMABLE=True,
        SECURITY_CONFIRM_URL='/login/password/confirm',
        SECURITY_SEND_CONFIRMATION_TEMPLATE='security/resend_confirmation.html',
        SECURITY_EMAIL_SUBJECT_CONFIRM='slide-atlas.org: Account Confirmation',
        # uses 'confirmation_instructions' email body template
        SECURITY_CONFIRM_EMAIL_WITHIN='5 days',
        SECURITY_LOGIN_WITHOUT_CONFIRMATION=False,

        ## Recover / reset a lost password
        SECURITY_RECOVERABLE=True,
        SECURITY_RESET_URL='/login/password/reset',
        SECURITY_FORGOT_PASSWORD_TEMPLATE='security/password_reset_1.html',  # step 1
        SECURITY_RESET_PASSWORD_TEMPLATE='security/password_reset_2.html',  # step 2
        SECURITY_EMAIL_SUBJECT_PASSWORD_RESET='slide-atlas.org: Password Reset Instructions',
        # uses 'reset_instructions' email body template
        SECURITY_RESET_PASSWORD_WITHIN='5 days',
        SECURITY_SEND_PASSWORD_RESET_NOTICE_EMAIL=False,  # TODO: do we want to send a confirmation email?
        SECURITY_EMAIL_SUBJECT_PASSWORD_NOTICE='slide-atlas.org: Password Reset Successful',
        # uses 'reset_notice' email body template

        ## Change a password
        SECURITY_CHANGEABLE=True,
        SECURITY_CHANGE_URL='/login/password/change',
        SECURITY_CHANGE_PASSWORD_TEMPLATE='security/password_change.html',
        SECURITY_SEND_PASSWORD_CHANGE_EMAIL=False,  # TODO: do we want to send a confirmation email?
        SECURITY_EMAIL_SUBJECT_PASSWORD_CHANGE_NOTICE='slide-atlas.org: Password Change Successful',
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

        REMEMBER_COOKIE_DOMAIN = app.session_interface.get_cookie_domain(app),

        REMEMBER_COOKIE_HTTPONLY = True,

        REMEMBER_COOKIE_SECURE = app.config['SLIDEATLAS_HTTPS'],
    )



################################################################################
class SlideatlasMongoEngineUserDatastore(MongoEngineUserDatastore):
    def __init__(self):
        # 'db' parameter is not necessary for this subclass
        super(SlideatlasMongoEngineUserDatastore, self).__init__(None, models.User, models.Role)
        self.user_creation_model = models.PasswordUser

    def create_user(self, **kwargs):
        """Creates and returns a new user from the given parameters."""
        kwargs = self._prepare_create_user_args(**kwargs)
        user = self.user_creation_model(**kwargs)
        return self.put(user)
