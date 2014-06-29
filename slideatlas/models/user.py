# coding=utf-8

import datetime
from itertools import chain

from mongoengine import DateTimeField, EmailField, EmbeddedDocumentField,\
    IntField, ListField, ReferenceField, StringField
from flask.ext.security import UserMixin

from .common import ModelDocument, PermissionDocument
from .group import Group

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
                'sparse': False,
            },
            {
                'fields': ('permissions.resource_type', 'permissions.resource_id'),
                'cls': False,
                'unique': False,
                'sparse': False,
            },
        ]
    }

    # TODO: make this an EmailField, but remove validation for 'bev_1'-type users
    # TODO: this should be required for password users, but not required for other auth providers
    email = StringField(required=False, max_length=255,
        verbose_name='E-Mail Address', help_text='The user\'s current email address.')

    full_name = StringField(required=True,
        verbose_name='Full Name', help_text='The user\'s full name.')

    created_at = DateTimeField(required=True, default=datetime.datetime.utcnow,
        verbose_name='Creation Time', help_text='The time of the user\'s account creation.')

    last_login_at = DateTimeField(required=False,
        verbose_name='Previous Login Time', help_text='The time of the user\'s second most recent login.')

    current_login_at = DateTimeField(required=False,
        verbose_name='Current Login Time', help_text='The time of the user\'s most recent login.')

    last_login_ip = StringField(required=False, max_length=15, # TODO: make special IP address field type?
        verbose_name='Previous Login IP', help_text='The IP address of the user\'s second most recent login.')

    current_login_ip = StringField(required=False, max_length=15,
        verbose_name='Current Login IP', help_text='The IP address of the user\'s most recent login.')

    login_count = IntField(required=True, default=0,
        verbose_name='Login Count', help_text='The total number of logins by the user.')

    permissions = ListField(EmbeddedDocumentField(PermissionDocument), required=False,
        verbose_name='Permissions', help_text='')

    groups = ListField(ReferenceField(Group), required=False,
        verbose_name='Groups', help_text='The list of groups that this user belongs to.')

    @property
    def label(self):
        email_domain = self.email.partition('@')[2] if self.email else '?'
        return '%s (@%s)' % (self.full_name, email_domain)

    @property
    def effective_permissions(self):
        """
        Provides both the user's permissions and the transitive group permissions,
        as Permission objects (named tuples).
        """
        return (permission_document.to_permission()
                for permission_document in chain(
                    self.permissions,
                    chain.from_iterable(group.permissions for group in self.groups)
                    )
        )

    @property
    def active(self):
        """
        This is used by Flask-Security to determine if a login is allowed at all.
        """
        return True

    @property
    def password(self):
        """
        This is required by Flask-Security for all users.

        Non-password users still require a password, to generate their secret
        auth token.
        """
        # TODO: change this to something secret and random for non-password users
        return str(self.id)

    @property
    def confirmed_at(self):
        """
        This is required by Flask-Security for all users.

        Return None, so that non-password users will not be considered
        'confirmed' upon an attempt as a password login, which will prevent
        login.
        """
        # TODO: update password form to provide a better error message when
        #   a non-password user attempts to login via password
        return None

    def __unicode__(self):
        return unicode('%s (%s)' % (self.full_name, self.email))


################################################################################
class PasswordUser(User):
    # TODO: index by token?

    password = StringField(required=True, max_length=255,
        verbose_name='Password', help_text='The user\'s current password.')

    confirmed_at = DateTimeField(required=False,
        verbose_name='Confirmation Time', help_text='The time that the user confirmed their email address.')


################################################################################
class GoogleUser(User):
    external_id = StringField(required=True,
        verbose_name='External ID', help_text='A unique identifier used to associate this user with an external authentication service.')


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
    # external_id is the user's eduPersonPrincipalName
    external_id = EmailField(required=True, max_length=255,
        verbose_name='External ID', help_text='A unique identifier used to associate this user with an external authentication service.')
