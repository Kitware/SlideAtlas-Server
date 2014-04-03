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
__all__ = ('OAuthLogin', 'login_user')


################################################################################
# TODO: move this class to a common utility module
class SingletonType(type):
    """
    A metaclass for singleton classes.
    """
    def __call__(cls, *args):
        if not hasattr(cls, 'instance'):
            cls.instance = super(SingletonType, cls).__call__(*args)
        return cls.instance


################################################################################
class OAuthLoginType(ABCMeta, SingletonType):
    pass


################################################################################
class OAuthLogin(object):

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


    @abstractmethod
    def create_oauth_service(self, oauth_client, app_config):
        """
        Calls 'oauth_client.remote_app' with the appropriate arguments and
        returns the result.
        """
        pass


    @abstractmethod
    def fetch_person(self, token):
        """
        Uses the OAuth provider's API to return an instance of Person with
        appropriate fields set.

        May raise a KeyError, which will be handled by the caller.
        """
        pass


    def update_user_properties(self, user, person):
        """
        Update the user model object, based upon a person returned by
        'fetch_person'.

        This method is not abstract, but may be overridden by subclasses.
        """
        user.email = person.email
        user.full_name = person.full_name


    __metaclass__ = OAuthLoginType


    oauth_client = OAuth()


    def __init__(self, app, blueprint):
        # 'init_app' really only needs to be done once, but it's idempotent, and
        #   this is a place with a convenient reference to 'app'
        self.oauth_client.init_app(app)

        self.oauth_service = self.create_oauth_service(self.oauth_client, app.config)

        blueprint.add_url_rule(rule='/login/%s' % self.name,
                               endpoint=self.endpoint,
                               view_func=anonymous_user_required(self.login_view),
                               methods=['GET'])

        blueprint.add_url_rule(rule='/login/%s/authorized' % self.name,
                               endpoint=self.endpoint_authorized,
                               view_func=anonymous_user_required(self.login_authorized_view),
                               methods=['GET'])

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
            error_code = request.args.get('error')
            if error_code:
                error_details = request.args.get('error_description', '')
                raise self.AuthorizationError('provider returned error: \"%s : %s\"' % (error_code, error_details),
                                                   401)  # Unauthorized
            else:
                raise self.AuthorizationError('invalid request arguments', 400)  # Bad Request
        if isinstance(token, OAuthException):
            raise self.AuthorizationError('OAuthException: %s' % token, 502)  # Bad Gateway
        if request.args['state'] != expected_state:
            raise self.AuthorizationError('mismatched state token', 400)  # Bad Request

        # Verify that all fields of person data were returned and non-empty
        try:
            person = self.fetch_person(token)
            for key, value in person._asdict().iteritems():
                if not value:
                    raise KeyError(key)
        except KeyError as e:
            raise self.AuthorizationError('\"%s\" field not provided by API' % e.message, 401)  # Unauthorized

        # Get user from database
        user_created = False
        try:
            # first, try getting by external_id, which may not be set in
            #   the database for every user
            user = self.user_model.objects.get(external_id=person.external_id)
        except self.user_model.DoesNotExist:
            try:
                # next, try email as a fallback, but email addresses may be
                #   changed by the OAuth provider
                user = self.user_model.objects.get(email=person.email)
            except self.user_model.DoesNotExist:
                # if a user still can't be found, assume it's a new user
                user_created = True
                user = self.user_model(external_id=person.external_id)

        # Update user properties, in case they've changed
        self.update_user_properties(user, person)
        user.save()

        if user_created:
            user_registered.send(current_app._get_current_object(), user=user, confirm_token=None)
            flash('New user created. Welcome to SlideAtlas!', 'info')
        else:
            flash('User account loaded from %s. Welcome back!' % self.pretty_name, 'info')


        return login_user(user)


    Person =  namedtuple('Person', ('external_id', 'full_name', 'email'))


    class AuthorizationError(Exception):
        oauth_provider='OAuth'

        def __init__(self, message='', status_code=500):
            self.message = message
            self.status_code = status_code
            super(OAuthLogin.AuthorizationError, self).__init__(str(self))

        def __unicode__(self):
            return unicode('%s access denied: %s' % (self.oauth_provider, self.message))

        def __str__(self):
            return unicode(self).encode('utf-8')

        @staticmethod
        def handler(error):
            flash(str(error), 'error')
            return redirect(url_for('.login'), code=error.status_code)


    @staticmethod
    def push_oauth_state():
        """
        Create, store, and return a random string.

        Used by OAuth to prevent CSRF.
        """
        state = gen_salt(10)
        session['oauth_state'] = state
        return state


    @staticmethod
    def pop_oauth_state():
        """
        Pop and return a stored random string.

        Used by OAuth to prevent CSRF.
        """
        return session.pop('oauth_state', None)


################################################################################
def login_user(user):
    flask_login_user(user, False)  # sets "session['user_id']"

    # if a 'next' parameter is in the request, that will be redirected to instead of the default
    return redirect(get_post_login_redirect())
