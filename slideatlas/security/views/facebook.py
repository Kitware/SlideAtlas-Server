# coding=utf-8

from collections import namedtuple

from slideatlas import models
from .common import OAuthLogin

################################################################################
__all__ = ()


################################################################################
class FacebookOAuthLogin(OAuthLogin):

    def create_oauth_service(self, oauth_client, app_config):
        consumer_key = app_config['SLIDEATLAS_FACEBOOK_APP_ID']
        consumer_secret = app_config['SLIDEATLAS_FACEBOOK_APP_SECRET']
        if (not consumer_key) or (not consumer_secret):
            return None

        return oauth_client.remote_app('facebook',
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,

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
    def icon_url(self):
        return '/static/img/facebook_32.png'


    @property
    def user_model(self):
        return models.FacebookUser


    @property
    def pretty_name(self):
        return 'Facebook'


    FacebookPerson = namedtuple('FacebookPerson', OAuthLogin.Person._fields + ('facebook_groups',))


    def fetch_person(self):
        # Fetch person data
        person_profile_url = '/me'
        # by default the profile API returns a limited number of fields,
        #   so explicitly request the desired fields
        person_profile_requested_fields = ['id', 'name', 'email']
        person_profile_url += '?fields=%s' % (','.join(person_profile_requested_fields))
        person_profile = self.oauth_service.get(person_profile_url)

        person_groups = self.oauth_service.get('/me/groups')

        # Verify that responses with person data were received
        for response in [person_profile, person_groups]:
            if response.status != 200:
                raise self.AuthorizationError('%s (%s)' % (response.data.get('message'), response.status), 502)  # Bad Gateway

        # Create and return person
        return self.FacebookPerson(
            external_id=person_profile.data.get('id'),
            full_name=person_profile.data.get('name'),
            email=person_profile.data.get('email'),
            facebook_groups=filter(None,(group_info.get('id') for group_info in person_groups.data.get('data'))),
        )


    def update_user_properties(self, user, person):
        super(FacebookOAuthLogin, self).update_user_properties(user, person)

        # Update user's groups from the latest Facebook groups
        # note that any user's groups that have a Facebook group ID, but for
        #   which the user is not a member of on Facebook will be removed when
        #   the user logs in via Facebook.
        non_facebook_groups = [group for group in user.groups if not group.facebook_id]
        current_facebook_groups = list(models.GroupRole.objects(facebook_id__in=person.facebook_groups))
        user.groups = non_facebook_groups + current_facebook_groups
