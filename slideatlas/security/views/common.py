# coding=utf-8

from abc import ABCMeta, abstractmethod, abstractproperty
from collections import namedtuple

from flask import current_app, flash, redirect, request, session, url_for
from flask.ext.security import login_user as flask_login_user
from flask.ext.security.decorators import anonymous_user_required
from flask.ext.security.utils import get_post_login_redirect, user_registered
from flask.ext.oauthlib.client import OAuth, OAuthException
from werkzeug.security import gen_salt

################################################################################
__all__ = ('login_user',)


################################################################################
# TODO: move this class to a common utility module
class SingletonMetaclass(type):
    """
    A metaclass for singleton classes.
    """
    def __call__(cls, *args):
        if not hasattr(cls, 'instance'):
            cls.instance = super(SingletonMetaclass, cls).__call__(*args)
        return cls.instance



################################################################################
class LoginProviderMetaclass(ABCMeta, SingletonMetaclass):
    pass


################################################################################
class LoginProvider(object):
    __metaclass__ = LoginProviderMetaclass

    @abstractproperty
    def user_model(self):
        """
        Returns the specific user model class for this login type.
        """
        pass


    @abstractproperty
    def pretty_name(self):
        """
        Returns the human-readable name for this OAuth provider.
        """
        pass


    @abstractproperty
    def icon_url(self):
        """
        Returns the absolute URL to the icon for this OAuth provider, to be used
        on the button.
        """
        pass


    @abstractmethod
    def fetch_person(self):
        """
        Uses the provider's API to return an instance of Person with appropriate
        fields set.
        """
        pass


    @abstractmethod
    def __init__(self, app, blueprint):
        self.enabled = False

        # create a sub-class of AuthorizationError with the appropriate 'oauth_provider'
        self.AuthorizationError = type('%sAuthorizationError' % self.pretty_name,
                                       (self.AuthorizationError,),
                                       {'oauth_provider': self.pretty_name})


    @property
    def name(self):
        return self.pretty_name.lower().replace(' ', '_')


    @property
    def endpoint(self):
        return 'login_%s' % self.name


    def is_enabled(self):
        return self.enabled


    Person =  namedtuple('Person', ('external_id', 'full_name', 'email'))


    def update_user_properties(self, user, person):
        """
        Update the user model object, based upon a person returned by
        'fetch_person'.

        This method is not abstract, but may be overridden by subclasses.
        """
        user.email = person.email
        user.full_name = person.full_name


    def do_login(self):
        """
        """
        # Verify that all fields of person data are returned and non-empty
        person = self.fetch_person()
        for key, value in person._asdict().iteritems():
            # person fields should not be empty, unless it's a list
            if (not value) and (not isinstance(value, list)):
                error_message = '\"%s\" field not provided by authentication provider' % key
                if key in ['external_id', 'full_name']:
                    # these fields are required, raise an error and don't proceed
                    raise self.AuthorizationError(error_message, 401)  # Unauthorized
                else:
                    # otherwise, flash a message for the missing field, but allow the login to continue
                    flash('%s.' % error_message, 'warning')

        # Get user from database
        created = False
        try:
            # first, try getting by external_id, which may not be set in
            #   the database for every user
            user = self.user_model.objects.get(external_id=person.external_id)
        except self.user_model.DoesNotExist:
            try:
                # next, try email as a fallback, but email addresses may be
                #   changed by the provider
                user = self.user_model.objects.get(email=person.email)
                # set external_id for use on subsequent logins
                user.external_id = person.external_id
            except self.user_model.DoesNotExist:
                # if a user still can't be found, assume it's a new user
                created = True
                user = self.user_model(external_id=person.external_id)

        # Update user properties, in case they've changed
        self.update_user_properties(user, person)
        user.save()

        if created:
            user_registered.send(current_app._get_current_object(), user=user, confirm_token=None)
            flash('New user created. Welcome to SlideAtlas!', 'info')
        else:
            flash('User account loaded from %s. Welcome back!' % self.pretty_name, 'info')

        return self.login_user(user)


    @staticmethod
    def login_user(user):
        flask_login_user(user, False)  # sets "session['user_id']"

        # if a 'next' parameter is in the request, that will be redirected to instead of the default
        return redirect(get_post_login_redirect())


    class AuthorizationError(Exception):
        oauth_provider='Provider'

        def __init__(self, message='', status_code=500):
            self.message = message
            self.status_code = status_code
            super(OAuthLogin.AuthorizationError, self).__init__(str(self))

        def __unicode__(self):
            return unicode('%s access denied: %s.' % (self.oauth_provider, self.message))

        def __str__(self):
            return unicode(self).encode('utf-8')

        @staticmethod
        def handler(error):
            flash(str(error), 'error')
            return redirect(url_for('.login'), code=error.status_code)


################################################################################
class OAuthLogin(LoginProvider):

    @abstractmethod
    def create_oauth_service(self, oauth_client, app_config):
        """
        Calls 'oauth_client.remote_app' with the appropriate arguments and
        returns the result or None if creation failed (e.g. due to missing
        config values).
        """
        pass


    oauth_client = OAuth()


    def __init__(self, app, blueprint):
        super(OAuthLogin, self).__init__(app, blueprint)

        # 'init_app' really only needs to be done once, but it's idempotent, and
        #   this is a place with a convenient reference to 'app'
        self.oauth_client.init_app(app)

        self.oauth_service = self.create_oauth_service(self.oauth_client, app.config)
        if self.oauth_service is None:
            # self.enabled is False by default
            return

        self.enabled = True

        blueprint.add_url_rule(rule='/login/%s' % self.name,
                               endpoint=self.endpoint,
                               view_func=anonymous_user_required(self.login_view),
                               methods=['GET'])

        blueprint.add_url_rule(rule='/login/%s/authorized' % self.name,
                               endpoint=self.endpoint_authorized,
                               view_func=anonymous_user_required(self.login_authorized_view),
                               methods=['GET'])


    @property
    def endpoint_authorized(self):
        return '%s_authorized' % self.endpoint


    def login_view(self):
        """
        Redirect the user to 'self.oauth_service.authorize_url'.

        The user will authenticate remotely, then be redirected back to the URL
        for 'login_authorized_view'.
        """
        return self.oauth_service.authorize(
            callback=url_for('.%s' % self.endpoint_authorized,
                             next=request.args.get('next') or request.referrer or None,  # TODO: test this
                             _external=True))


    @property
    def login_authorized_view(self):
        return self.oauth_service.authorized_handler(self._login_authorized_view)


    def _login_authorized_view(self, token=None):
        """
        The user is redirected to this view by the authentication provider.

        The 'self.oauth_service.authorized_handler' decorator converts the
        request into the 'token' parameter, which may be either an OAuth access
        token to be used for subsequent API requests or an 'OAuthException'.
        """

        # Validate the token
        # pop from session first, in case an exception is raised
        expected_state = self.pop_oauth_state()
        if token is None:
            error_message = request.args.get('error')
            if error_message:
                error_details = request.args.get('error_description', '')
                if error_details:
                    error_message += ' : %s' % error_details
                raise self.AuthorizationError('provider returned error: \"%s\"' % error_message,
                                                   401)  # Unauthorized
            else:
                raise self.AuthorizationError('invalid request arguments', 400)  # Bad Request
        if isinstance(token, OAuthException):
            raise self.AuthorizationError('OAuthException: %s' % token, 502)  # Bad Gateway
        if request.args['state'] != expected_state:
            raise self.AuthorizationError('mismatched state token', 400)  # Bad Request

        # Make the token available for API requests
        self.oauth_service.tokengetter(lambda: token)

        return self.do_login()


    def push_oauth_state(self):
        """
        Create, store, and return a random string.

        Used by OAuth to prevent CSRF.
        """
        state = gen_salt(10)
        session['oauth_state'] = state
        return state


    def pop_oauth_state(self):
        """
        Pop and return a stored random string.

        Used by OAuth to prevent CSRF.
        """
        return session.pop('oauth_state', None)


################################################################################
# expose this for use when testing
login_user = LoginProvider.login_user
