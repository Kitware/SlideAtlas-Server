# coding=utf-8

from slideatlas import models
from .common import OAuthLogin

################################################################################
__all__ = ('LinkedinOAuthLogin',)


################################################################################
class LinkedinOAuthLogin(OAuthLogin):

    def create_oauth_service(self, oauth_client, app_config):
        oauth_service = oauth_client.remote_app('linkedin',
            consumer_key=app_config['SLIDEATLAS_LINKEDIN_APP_ID'],
            consumer_secret=app_config['SLIDEATLAS_LINKEDIN_APP_SECRET'],

            # Used by authorize()
            authorize_url='https://www.linkedin.com/uas/oauth2/authorization',
            request_token_params={
                'scope': 'r_basicprofile r_emailaddress',
                'state': self.push_oauth_state
            },

            # Used by authorized_handler()
            access_token_method='POST',
            access_token_url='https://www.linkedin.com/uas/oauth2/accessToken',

            # Used by get() API requests
            base_url='https://api.linkedin.com/v1/',
        )
        oauth_service.pre_request = self.change_linkedin_query

        return oauth_service


    @property
    def user_model(self):
        return models.LinkedinUser


    @property
    def pretty_name(self):
        return 'LinkedIn'


    def fetch_person(self, token):
        # Fetch person data
        person_profile_url = 'people/~'
        # by default the profile API returns a limited number of fields,
        #   so explicitly request the desired fields
        person_profile_requested_fields = ['id', 'formatted-name']
        person_profile_url += ':(%s)' % (','.join(person_profile_requested_fields))
        person_profile = self.oauth_service.get(person_profile_url, token=token)

        person_email = self.oauth_service.get('people/~/email-address', token=token)
        # the email API has only 1 field available, which is always returned

        # Verify that responses with person data were received
        for response in [person_profile, person_email]:
            if response.status != 200:
                raise self.AuthorizationError('%s (%s)' % (response.data.get('message'), response.status), 502)  # Bad Gateway

        # Create and return person
        return self.Person(
            external_id=person_profile.data['id'],
            full_name=person_profile.data['formattedName'],
            email=person_email.data
        )


    @staticmethod
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
