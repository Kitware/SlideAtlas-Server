# coding=utf-8

from collections import namedtuple
from functools import partial

from enum import Enum
from mongoengine import EmbeddedDocument, ObjectIdField
from mongoengine.base import BaseField

from .model_document import ToSonDocumentMixin

################################################################################
__all__ = ('Operation', 'Permission', 'ResourceType',
           'AdminSitePermission', 'AdminCollectionPermission',
           'AdminSessionPermission', 'EditCollectionPermission',
           'EditSessionPermission', 'ViewCollectionPermission',
           'ViewSessionPermission',
           'PermissionDocument')


################################################################################
# lower-priority operations must come first
Operation = Enum('view', 'edit', 'admin')

ResourceType = Enum('session', 'collection', 'site')

Permission = namedtuple('Permission', ('operation', 'resource_type', 'resource_id'))

AdminSitePermission = partial(Permission, *(Operation.admin, ResourceType.site, None))
AdminCollectionPermission = partial(Permission, *(Operation.admin, ResourceType.collection))
AdminSessionPermission = partial(Permission, *(Operation.admin, ResourceType.session))
EditCollectionPermission = partial(Permission, *(Operation.edit, ResourceType.collection))
EditSessionPermission = partial(Permission, *(Operation.edit, ResourceType.session))
ViewCollectionPermission = partial(Permission, *(Operation.view, ResourceType.collection))
ViewSessionPermission = partial(Permission, *(Operation.view, ResourceType.session))


class EnumField(BaseField):
    def __init__(self, enum_type, *args, **kwargs):
        self.enum_type = enum_type
        kwargs['choices'] = tuple(enum_type)
        super(EnumField, self).__init__(*args, **kwargs)

    def to_mongo(self, value):
        return value.key

    def to_python(self, value):
        if isinstance(value, int):
            return self.enum_type[value]
        elif isinstance(value, basestring):
            return getattr(self.enum_type, value)
        return value


class PermissionDocument(EmbeddedDocument, ToSonDocumentMixin):

    operation = EnumField(Operation, required=True,
        verbose_name='Operation', help_text='')

    resource_type = EnumField(ResourceType, required=True,
        verbose_name='Resource Type', help_text='')

    resource_id = ObjectIdField(required=False,
        verbose_name='Resource Id', help_text='')

    # TODO: validate resource_id

    def to_permission(self):
        return Permission(**{field_name: getattr(self, field_name) for field_name in self})
