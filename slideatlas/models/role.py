# coding=utf-8

from mongoengine import EmbeddedDocumentField, ListField, StringField

from .common import ModelDocument, PermissionDocument

################################################################################
__all__ = ('Role', 'UserRole', 'GroupRole')


################################################################################
class Role(ModelDocument):
    meta = {
        'db_alias': 'admin_db',
        'collection': 'rules',
        'allow_inheritance': True,
        }

    label = StringField(required=True,  # TODO:make unique
        verbose_name='Name', help_text='')

    permissions = ListField(EmbeddedDocumentField(PermissionDocument), required=False,
        verbose_name='Permissions', help_text='')

    # db = ReferenceField(ImageStore, dbref=False, required=True,
    #     verbose_name='Image Store', help_text='The image store that this role applies to.')
    #
    # can_see = ListField(ObjectIdField(), required=False,
    #     verbose_name='Can See Sessions', help_text='The sessions that the user can view.')
    #
    # can_see_all = BooleanField(required=False,
    #     verbose_name='Can See All Sessions', help_text='The user can view all sessions in this database.')
    #
    # db_admin = BooleanField(required=False,
    #     verbose_name='Database Administrator', help_text='The user is a database-wide administrator for this rule\'s database.')
    #
    # site_admin = BooleanField(required=False,
    #     verbose_name='Site Administrator', help_text='The user is a site-wide administrator.')

    def __unicode__(self):
        return unicode(self.label)


class UserRole(Role):
    pass


class GroupRole(Role):
    # TODO: index facebook_id
    # meta = {
    #     'indexes': [
    #         {
    #             'fields': ('facebook_id',),
    #             'cls': True,
    #             'unique': False,
    #             'sparse': False,
    #         },
    #     ]
    # }

    facebook_id = StringField(required=False,
        verbose_name='Facebook Group ID', help_text='The Facebook group ID that corresponds to the role.')
