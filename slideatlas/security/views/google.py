# coding=utf-8

from flask import flash, request, session, url_for

from slideatlas import models
from .common import OAuthLogin

################################################################################
__all__ = ()


################################################################################
class GoogleOAuthLogin(OAuthLogin):

    def create_oauth_service(self, oauth_client, app_config):
        consumer_key = app_config['SLIDEATLAS_GOOGLE_APP_ID']
        consumer_secret = app_config['SLIDEATLAS_GOOGLE_APP_SECRET']
        if (not consumer_key) or (not consumer_secret):
            return None

        return oauth_client.remote_app('google',
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,

            # Used by authorize()
            authorize_url='https://accounts.google.com/o/oauth2/auth',
            request_token_params={
                'scope': 'profile email',
                'state': self.push_oauth_state
            },

            # Used by authorized_handler()
            access_token_method='POST',
            access_token_url='https://accounts.google.com/o/oauth2/token',

            # Used by get() API requests
            base_url='https://www.googleapis.com/plus/v1/',
        )


    @property
    def user_model(self):
        return models.GoogleUser


    @property
    def pretty_name(self):
        return 'Google'


    @property
    def icon_url(self):
        return '/static/img/google_32.png'


    def login_view(self):
        # Google OAuth's 'redirect_uri' must exactly match what was registered
        #   for the app, including the query string. This means that a 'next'
        #   parameter cannot be part of 'redirect_uri'. However, 'login_user'
        #   will redirect to a URL contained in a special session variable if
        #   it is set and the 'next' parameter isn't otherwise set.
        post_login_url = request.args.get('next')
        if post_login_url:
            # this will be unset when it's read
            session['security_post_login_view'] = post_login_url

        return self.oauth_service.authorize(
            callback=url_for('.%s' % self.endpoint_authorized,
                             _external=True))


    def fetch_person(self):
        # Fetch person data
        person_profile_url = 'people/me'
        # explicitly request the desired fields, to ensure they are returned
        # person_profile_requested_fields = ['id', 'displayName', 'email']
        # person_profile_url += '?fields=%s' % (','.join(person_profile_requested_fields))
        person_profile = self.oauth_service.get(person_profile_url)

        # Verify that a response with person data was received
        if person_profile.status != 200:
            error_message = person_profile.data.get('error', dict()).get('message', '')
            error_code = person_profile.status
            raise self.AuthorizationError('%s (%s)' % (error_message, error_code), 502)  # Bad Gateway

        person_all_emails = person_profile.data.get('emails', list())
        if person_all_emails:
            # prefer email address with 'account' type
            person_emails = [email.get('value') for email in person_all_emails if (email.get('type') == 'account')]
            # if an 'account' email can't be found, consider them all
            if not person_emails:
                person_emails = person_all_emails
            # if we're in this conditional, at least 1 email exists
            person_email = person_emails[0]
            if len(person_emails) > 1:
                flash('Authentication provider returned multiple email addresses. Using the first one: \"%s\".' % person_email,
                      'warning')
        else:
            person_email = None

        # Create and return person
        return self.Person(
            external_id=person_profile.data.get('id'),
            full_name=person_profile.data.get('displayName'),
            email=person_email,
        )
