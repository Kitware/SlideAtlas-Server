# coding=utf-8

from collections import namedtuple
from functools import partial

from bson import ObjectId
from mongoengine import BooleanField, ListField, ObjectIdField, \
    ReferenceField, StringField
from mongoengine.base import BaseField

from .common import ModelDocument
from .collection import Collection
from .image_store import ImageStore

################################################################################
__all__ = ('Permission', 'Role', 'UserRole', 'GroupRole')


################################################################################
Permission = namedtuple('Permission', ('operation', 'resource_type', 'resource_id'))

AdminSitePermission = partial(Permission, *('admin', 'site', None))
AdminCollectionPermission = partial(Permission, *('admin', 'collection'))
AdminSessionPermission = partial(Permission, *('admin', 'session'))
ViewCollectionPermission = partial(Permission, *('view', 'collection'))
ViewSessionPermission = partial(Permission, *('view', 'session'))


class PermissionField(BaseField):

    def to_mongo(self, value):
        list(value)

    def to_python(self, value):
        return Permission(*value)

    def validate(self, value):
        # TODO: remove
        from .session import Session

        if not isinstance(value, Permission):
            self.error('Must be an instance of Permission')

        if value.operation not in ['admin', 'view']:
            self.error('Invalid operation: "%s"' % value.operation)

        if value.resource_type == 'site':
            if value.resource_id is not None:
                self.error('For "site" resource type, resource id must be None')
        elif value.resource_type == 'collection':
            if not (isinstance(value.resource_id, ObjectId) and
                    Collection.objects.with_id(value.resource_id)):
                self.error('For "collection" resource type, resource id must be an ObjectId for a Collection')
        elif value.resource_type == 'session':
            if not (isinstance(value.resource_id, ObjectId) and
                    Session.objects.with_id(value.resource_id)):
                self.error('For "session" resource type, resource id must be an ObjectId for a Session')
        else:
            self.error('Invalid resource type: "%s"' % value.resource_type)


################################################################################
class Role(ModelDocument):
    meta = {
        'db_alias': 'admin_db',
        'collection': 'rules',
        'allow_inheritance': True,
        }

    label = StringField(required=True,  # TODO:make unique
        verbose_name='Name', help_text='')

    permissions = ListField(PermissionField(), required=False,
        verbose_name='Permissions', help_text='')

    # @property
    # def permissions(self):
    #     if self.site_admin:
    #         yield AdminSitePermission()
    #     if self.db_admin:
    #         yield AdminCollectionPermission(Collection.objects(image_store=self.db).scalar('id').first())
    #     if self.can_see_all:
    #         yield ViewCollectionPermission(Collection.objects(image_store=self.db).scalar('id').first())
    #     for session_id in self.can_see:
    #         yield ViewSessionPermission(session_id)
    #
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
