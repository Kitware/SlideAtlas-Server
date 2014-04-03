# coding=utf-8

from collections import namedtuple

from slideatlas import models
from .common import OAuthLogin

################################################################################
__all__ = ('FacebookOAuthLogin',)


################################################################################
class FacebookOAuthLogin(OAuthLogin):

    def create_oauth_service(self, oauth_client, app_config):
        return oauth_client.remote_app('facebook',
            consumer_key=app_config['SLIDEATLAS_FACEBOOK_APP_ID'],
            consumer_secret=app_config['SLIDEATLAS_FACEBOOK_APP_SECRET'],

            # Used by authorize()
            authorize_url='https://www.facebook.com/dialog/oauth',
            request_token_params={
                'scope': 'basic_info,email,user_groups',
                'state': self.push_oauth_state
            },

            # Used by authorized_handler() and get() API requests
            base_url='https://graph.facebook.com/',

            # Used by authorized_handler()
            access_token_url='/oauth/access_token',
        )


    @property
    def user_model(self):
        return models.FacebookUser


    @property
    def pretty_name(self):
        return 'Facebook'


    FacebookPerson = namedtuple('FacebookPerson', OAuthLogin.Person._fields + ('facebook_groups',))


    def fetch_person(self, token):
        # Fetch person data
        person_profile_url = '/me'
        # by default the profile API returns a limited number of fields,
        #   so explicitly request the desired fields
        person_profile_requested_fields = ['id', 'name', 'email']
        person_profile_url += '?fields=%s' % (','.join(person_profile_requested_fields))
        person_profile = self.oauth_service.get(person_profile_url, token=token)

        person_groups = self.oauth_service.get('/me/groups', token=token)

        # Verify that responses with person data were received
        for response in [person_profile, person_groups]:
            if response.status != 200:
                raise self.AuthorizationError('%s (%s)' % (response.data.get('message'), response.status), 502)  # Bad Gateway

        # Create and return person
        return self.FacebookPerson(
            external_id=person_profile.data['id'],
            full_name=person_profile.data['name'],
            email=person_profile.data['email'],
            facebook_groups=[group_info['id'] for group_info in person_groups.data['data']],
        )
