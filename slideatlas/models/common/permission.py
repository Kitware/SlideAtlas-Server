# coding=utf-8

from collections import namedtuple
from functools import partial

from mongoengine import EmbeddedDocument, ObjectIdField, StringField

from .model_document import ToSonDocumentMixin

################################################################################
__all__ = ('Permission', 'AdminSitePermission', 'AdminCollectionPermission',
           'AdminSessionPermission', 'ViewCollectionPermission',
            'ViewSessionPermission', 'PermissionDocument')


################################################################################
# TODO: change the tuple values to use an enum, instead of strings
Permission = namedtuple('Permission', ('operation', 'resource_type', 'resource_id'))

AdminSitePermission = partial(Permission, *('admin', 'site', None))
AdminCollectionPermission = partial(Permission, *('admin', 'collection'))
AdminSessionPermission = partial(Permission, *('admin', 'session'))
ViewCollectionPermission = partial(Permission, *('view', 'collection'))
ViewSessionPermission = partial(Permission, *('view', 'session'))

class PermissionDocument(EmbeddedDocument, ToSonDocumentMixin):

    operation = StringField(required=True, choices=('view', 'admin'),
        verbose_name='Operation', help_text='')

    resource_type = StringField(required=True, choices=('session', 'collection', 'site'),
        verbose_name='Resource Type', help_text='')

    resource_id = ObjectIdField(required=False,
        verbose_name='Resource Id', help_text='')

    # TODO: validate resource_id

    def to_permission(self):
        return Permission(**self.to_son(include_empty=True).to_dict())
