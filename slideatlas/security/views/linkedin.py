# coding=utf-8

from flask import flash, request, url_for
from flask.ext.oauthlib.client import OAuthException

from slideatlas import models
from .common import oauth, login_user, push_oauth_state, pop_oauth_state, OAuthAuthorizationError

################################################################################
__all__ = ('register', 'login_linkedin')


################################################################################
def register(app, blueprint):
    linkedin = oauth.remote_app('linkedin',
        consumer_key=app.config['SLIDEATLAS_LINKEDIN_APP_ID'],
        consumer_secret=app.config['SLIDEATLAS_LINKEDIN_APP_SECRET'],

        # Used by authorize()
        authorize_url='https://www.linkedin.com/uas/oauth2/authorization',
        request_token_params={
            'scope': 'r_basicprofile r_emailaddress',
            'state': push_oauth_state
        },

        # Used by authorized_handler()
        access_token_method='POST',
        access_token_url='https://www.linkedin.com/uas/oauth2/accessToken',

        # Used by get() API requests
        base_url='https://api.linkedin.com/v1/',
    )
    # Used by get() API requests
    linkedin.pre_request = change_linkedin_query

    blueprint.add_url_rule(rule='/login/linkedin/authorized',
                           view_func=linkedin.authorized_handler(login_linkedin_authorized),
                           methods=['GET'])

    oauth.init_app(app)


################################################################################
def login_linkedin():
    """
    Redirect the user to 'linkedin.authorize_url'.

    The user will authenticate remotely, then be redirected back to the URL for
    'login_linkedin_authorized'.
    """
    linkedin = oauth.remote_apps['linkedin']
    return linkedin.authorize(
        callback=url_for('.login_linkedin_authorized',
                         next=request.args.get('next') or request.referrer or None,  # TODO: test this
                         _external=True),
    )


################################################################################
class LinkedinAuthorizationError(OAuthAuthorizationError):
    oauth_service = 'LinkedIn'


def login_linkedin_authorized(token=None):
    """
    The user is redirected to this view by the authentication provider.

    The 'linkedin.authorized_handler' decorator converts the request into the
    'token' parameter, which may be either an OAuth access token to be used for
    subsequent API requests or an 'OAuthException'.
    """
    # Validate the token
    expected_state = pop_oauth_state()
    if token is None:
        error_code = request.args.get('error')
        if error_code:
            error_details = request.args.get('error_description', '')
            raise LinkedinAuthorizationError('provider returned error: \"%s : %s\"' % (error_code, error_details),
                                             401)  # Unauthorized
        else:
            raise LinkedinAuthorizationError('invalid request arguments', 400)  # Bad Request
    if isinstance(token, OAuthException):
        raise LinkedinAuthorizationError('OAuthException: %s' % (token), 502)  # Bad Gateway
    if request.args['state'] != expected_state:
        raise LinkedinAuthorizationError('mismatched state token', 400)  # Bad Request

    linkedin = oauth.remote_apps['linkedin']

    # Fetch person data
    person_profile_url = 'people/~'
    # by default the profile API returns a limited number of fields
    #   so explicitly request the desired fields
    person_profile_requested_fields = ['id', 'formatted-name']
    person_profile_url += ':(%s)' % (','.join(person_profile_requested_fields))
    person_profile = linkedin.get(person_profile_url, token=token)

    person_email = linkedin.get('people/~/email-address', token=token)
    # the email API has only 1 field available, which is always returned

    # Verify that responses with person data were received
    for response in [person_profile, person_email]:
        if response.status != 200:
            raise LinkedinAuthorizationError('%s (%s)' % (response.data.get('message'), response.status), 502)  # Bad Gateway

    # Verify that all fields of person data were returned and non-empty
    try:
        person = {
            'external_id': person_profile.data['id'],
            'full_name': person_profile.data['formattedName'],
            'email': person_email.data,
        }
        for key, value in person.iteritems():
            if not value:
                raise KeyError(key)
    except KeyError as e:
        raise LinkedinAuthorizationError('\"%s\" field not provided by API' % e.message, 401)  # Unauthorized

    # Get user from database
    # WARNING: the person 'id' returned by LinkedIn is specific to this
    #   OAuth app key; if the app key ever is reset, all existing LinkedinUser
    #   'external_id' fields will become invalid
    user, created = models.LinkedinUser.objects.get_or_create(external_id=person['external_id'], auto_save=False)
    if created:
        flash('New LinkedIn user account created', 'info')
    else:
        flash('LinkedIn user account exists', 'info')

    # Update user properties, in case they've changed
    user.email = person['email']
    user.full_name = person['full_name']
    user.save()

    return login_user(user)


################################################################################
def change_linkedin_query(uri, headers, body):
    """
    LinkedIn's API requests don't strictly comply with OAuth2 standards. This
    function just-in-time rewrites the requests to operate with LinkedIn.
    """
    auth = headers.pop('Authorization')
    headers['x-li-format'] = 'json'
    if auth:
        auth = auth.replace('Bearer', '').strip()
        if '?' in uri:
            uri += '&oauth2_access_token=' + auth
        else:
            uri += '?oauth2_access_token=' + auth
    return uri, headers, body
