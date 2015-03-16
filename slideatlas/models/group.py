# coding=utf-8

from mongoengine import EmbeddedDocumentField, ListField, StringField

from .common import ModelDocument, PermissionDocument
from .common.mixins import SingletonDocumentMixin

################################################################################
__all__ = ('Group', 'PublicGroup', 'UnlistedGroup')


################################################################################
class BaseGroup(ModelDocument):
    meta = {
        'db_alias': 'admin_db',
        'collection': 'groups',
        'allow_inheritance': True,
        'indexes': [
            {
                'fields': ('permissions.resource_type', 'permissions.resource_id'),
                'cls': False,
                'unique': False,
                'sparse': False,
            },
        ]
    }

    permissions = ListField(EmbeddedDocumentField(PermissionDocument), required=False,
        verbose_name='Permissions', help_text='')


################################################################################
class Group(BaseGroup):
    meta = {
        'indexes': [
            {
                'fields': ('facebook_id',),
                'cls': False,
                'unique': False,
                'sparse': True,
            },
        ]
    }

    label = StringField(required=True,  # TODO:make unique
        verbose_name='Name', help_text='')

    facebook_id = StringField(required=False,
        verbose_name='Facebook Group ID', help_text='The Facebook group ID that corresponds to the group.')


################################################################################
class PublicGroup(BaseGroup, SingletonDocumentMixin):
    @property
    def label(self):
        return 'Public'


################################################################################
class UnlistedGroup(BaseGroup, SingletonDocumentMixin):
    @property
    def label(self):
        return 'Unlisted'
