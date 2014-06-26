# coding=utf-8

from mongoengine import EmbeddedDocumentField, ListField, StringField

from .common import ModelDocument, PermissionDocument

################################################################################
__all__ = ('Group',)


################################################################################
class Group(ModelDocument):
    meta = {
        'db_alias': 'admin_db',
        'collection': 'rules',
        'allow_inheritance': True,
        'indexes': [
            {
                'fields': ('permissions.resource_type', 'permissions.resource_id'),
                'cls': False,
                'unique': False,
                'sparse': False,
            },
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

    permissions = ListField(EmbeddedDocumentField(PermissionDocument), required=False,
        verbose_name='Permissions', help_text='')

    facebook_id = StringField(required=False,
        verbose_name='Facebook Group ID', help_text='The Facebook group ID that corresponds to the group.')

    def __unicode__(self):
        return unicode(self.label)
