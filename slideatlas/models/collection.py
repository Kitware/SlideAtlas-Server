# coding=utf-8

from mongoengine import Q, ListField, ReferenceField, StringField

from .common import ModelDocument, Operation, ResourceType, AdminSitePermission
from .common.model_document import ModelQuerySet
from .image_store import ImageStore
import session  # this style required to avoid circular imports

################################################################################
__all__ = ('Collection',)


################################################################################
class CollectionQuerySet(ModelQuerySet):
    class MaxValueDict(dict):
        def set_max(self, key, value):
            if self.get(key, 0) < value:
                self[key] = value

    def _filter_permissions(self, return_accesses, permissions_set, required_operation=Operation.view, strict_operation=False):
        if not isinstance(permissions_set, set):
            raise ValueError('permissions_set must be a set of Permissions')
        queryset = self.clone()
        if AdminSitePermission() in permissions_set and \
           ((not strict_operation) or (required_operation == Operation.admin)):
            result = queryset.all()
            if return_accesses:
                return [(doc, Operation.admin) for doc in result]
            else:
                return result
        else:
            collection_accesses = self.MaxValueDict()
            query_collections = set()
            query_sessions = set()
            for permission in permissions_set:
                if permission.resource_type == ResourceType.collection:
                    if permission.operation >= required_operation:
                        query_collections.add(permission.resource_id)
                        if return_accesses:
                            collection_accesses.set_max(permission.resource_id, permission.operation)
                    elif (permission.resource_type == ResourceType.session) and \
                         (required_operation == Operation.view):
                        query_sessions.add(permission.resource_id)

            if query_sessions:
                session_collections = session.Session.objects(id__in=list(query_sessions)).no_dereference().distinct('collection')
                query_collections.update(session_collections)
                if return_accesses:
                    for collection_id in session_collections:
                        collection_accesses.set_max(collection_id, Operation.view)

            query = Q(id__in=list(query_collections))
            result = queryset.filter(query)
            if return_accesses:
                return [(doc, collection_accesses[doc.id]) for doc in result]
            else:
                return result


    def can_access(self, permissions_set, required_operation=Operation.view, strict_operation=False):
        """
        :param permissions_set: A set of Permission objects to filter the collection query by.
        :type permissions_set: set of [common.Permission]

        :param required_operation: The minimum operation allowed on the collections.
        :type required_operation: common.Operation

        :param strict_operation: Make 'required_operation' strictly refer to an operation type, instead of a minimum.
        :type strict_operation: bool

        :rtype: CollectionQuerySet
        """
        return self._filter_permissions(False, permissions_set, required_operation, strict_operation)


    def with_accesses(self, permissions_set, required_operation=Operation.view, strict_operation=False):
        """
        :param permissions_set: A set of Permission objects to filter the collection query by.
        :type permissions_set: set of [common.Permission]

        :param required_operation: The minimum operation allowed on the collections.
        :type required_operation: common.Operation

        :param strict_operation: Make 'required_operation' strictly refer to an operation type, instead of a minimum.
        :type strict_operation: bool

        :rtype: list of (Collection, Operation)
        """
        return self._filter_permissions(True, permissions_set, required_operation, strict_operation)


################################################################################
class Collection(ModelDocument):
    """
    An ImageStore holds image metadata and tiles.
    """
    meta = {
        'db_alias': 'admin_db',
        'collection': 'collections',
        'queryset_class': CollectionQuerySet,
    }

    image_store = ReferenceField(ImageStore, required=True,
        verbose_name='Image Store', help_text='The default image store for content uploaded to this collection.')

    label = StringField(required=True, #TODO: make unique
        verbose_name='Label', help_text='The human-readable label.')

    copyright = StringField(required=True, default='Copyright &copy; 2014. All rights reserved.',
        verbose_name='Copyright', help_text='The default copyright for content.')

    creator_codes = ListField(StringField(), required=False,
        verbose_name='Creator Codes', help_text='A list of identifier codes for images to be uploaded to this collection.')

    def __unicode__(self):
        return unicode(self.label)
