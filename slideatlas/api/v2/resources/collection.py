# coding=utf-8

from slideatlas import models, security
from ..base import APIResource, ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('CollectionListAPI', 'CollectionItemAPI', 'CollectionAccessAPI')


################################################################################
class CollectionListAPI(ListAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self):
        collections = models.Collection.objects.order_by('label')
        return dict(collections=collections.to_son(only_fields=('label',)))

    def post(self):
        abort(501)  # Not Implemented


################################################################################
class CollectionItemAPI(ItemAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, collection):
        collection_son = collection.to_son()
        sessions = models.Session.objects(collection=collection)
        collection_son['sessions'] = sessions.to_son(only_fields=('label', 'type'))
        return dict(collections=[collection_son])

    def put(self, collection):
        abort(501)  # Not Implemented

    def patch(self, collection):
        abort(501)  # Not Implemented

    def delete(self, collection):
        abort(501)  # Not Implemented


################################################################################
class CollectionAccessAPI(APIResource):
    @security.AdminCollectionRequirement.protected
    def get(self, collection):
        groups = models.Group.objects(permissions__resource_type='collection',
                                      permissions__resource_id=collection.id
                                     ).order_by('label')

        return dict(users=[], groups=groups.to_son(only_fields=('label',)))

    @security.AdminCollectionRequirement.protected
    def post(self, collection):
        abort(501)  # Not Implemented


################################################################################
api.add_resource(CollectionListAPI,
                 '/collections',
                 endpoint='collection_list',
                 methods=('GET', 'POST'))

api.add_resource(CollectionItemAPI,
                 '/collections/<Collection:collection>',
                 endpoint='collection_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))

api.add_resource(CollectionAccessAPI,
                 '/collections/<Collection:collection>/access',
                 endpoint='collection_access',
                 methods=('GET', 'POST'))
