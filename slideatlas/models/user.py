# coding=utf-8

import datetime

from mongoengine import BooleanField,DateTimeField, EmailField, IntField, ListField, ReferenceField, StringField
from flask.ext.security import UserMixin

from .common import ModelDocument
from .role import Role

################################################################################
__all__ = ('User', 'PasswordUser', 'GoogleUser', 'FacebookUser', 'LinkedinUser', 'ShibbolethUser')


################################################################################
class User(ModelDocument, UserMixin):
    # TODO: prevent this class from being instantiated directly
    meta = {
        'db_alias': 'admin_db',
        'collection': 'users',
        'allow_inheritance': True,
        'indexes': [
            {
                'fields': ('email',), # TODO: index by a unique auth-provided identifier
                'cls': True,
                'unique': True,
            },
        ]
    }

    active = BooleanField(required=True, default=True,
        verbose_name='Active', help_text='An inactive user may not log in, but is retained in the database.')

    # TODO: make this an EmailField, but remove validation for 'bev_1'-type users
    email = StringField(required=True, max_length=255,
        verbose_name='E-Mail Address', help_text='The user\'s current email address.')

    full_name = StringField(required=True, db_field='label',
        verbose_name='Full Name', help_text='The user\'s full name.')

    created_at = DateTimeField(required=True, default=datetime.datetime.utcnow, db_field='first_login',
        verbose_name='Creation Time', help_text='The time of the user\'s account creation.')

    last_login_at = DateTimeField(required=False,
        verbose_name='Previous Login Time', help_text='The time of the user\'s second most recent login.')

    current_login_at = DateTimeField(required=False, db_field='last_login',
        verbose_name='Current Login Time', help_text='The time of the user\'s most recent login.')

    last_login_ip = StringField(required=False, max_length=15, # TODO: make special IP address field type?
        verbose_name='Previous Login IP', help_text='The IP address of the user\'s second most recent login.')

    current_login_ip = StringField(required=False, max_length=15,
        verbose_name='Current Login IP', help_text='The IP address of the user\'s most recent login.')

    login_count = IntField(required=True, default=0,
        verbose_name='Login Count', help_text='The total number of logins by the user.')

    roles = ListField(ReferenceField(Role, dbref=False), required=False, db_field='rules',
        verbose_name='Roles', help_text='A list of access roles for the user.')

    @property
    def password(self):
        """
        A password field is required for Flask-Security

        TODO: make this a salt field in the database for all non-PasswordUsers
        """
        return str(self.id)

    def __unicode__(self):
        return unicode('%s (%s)' % (self.full_name, self.email))

    def update_current_login(self):
        self.current_login_at = datetime.datetime.utcnow()


################################################################################
class PasswordUser(User):
    # TODO: index by token?

    password = StringField(required=True, db_field='passwd', max_length=255,
        verbose_name='Password', help_text='The user\'s current password.')

    confirmed_at = DateTimeField(required=False,
        verbose_name='Confirmation Time', help_text='The time that the user confirmed their email address.')


################################################################################
class GoogleUser(User):
    pass


################################################################################
class FacebookUser(User):
    external_id = StringField(required=True,
        verbose_name='External ID', help_text='A unique identifier used to associate this user with an external authentication service.')


################################################################################
class LinkedinUser(User):
    # WARNING: the person 'id' returned by LinkedIn is specific to one OAuth app
    #   key; if the app key ever is reset, all existing LinkedinUser
    #   'external_id' fields will become invalid
    external_id = StringField(required=True,
        verbose_name='External ID', help_text='A unique identifier used to associate this user with an external authentication service.')


################################################################################
class ShibbolethUser(User):
    eppn = EmailField(required=True, max_length=255,
        verbose_name='EPPN', help_text='The user\'s eduPersonPrincipalName, a permanent identifier.')
