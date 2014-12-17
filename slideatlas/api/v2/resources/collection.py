# coding=utf-8

from flask import g

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource, AccessAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('CollectionListAPI', 'CollectionItemAPI', 'CollectionAccessAPI')


################################################################################
class CollectionListAPI(ListAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self):
        collections_with_accesses = models.Collection.objects.\
            only('label').order_by('label').with_accesses(g.identity.provides)
        def _to_collection_son(item):
            collection, operation = item
            collection_son = collection.to_son(only_fields=('label',))
            collection_son['_access'] = str(operation)
            return collection_son
        collections_son = map(_to_collection_son, collections_with_accesses)
        return collections_son

    def post(self):
        abort(501)  # Not Implemented


################################################################################
class CollectionItemAPI(ItemAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, collection):
        collection_son = collection.to_son()
        sessions = models.Session.objects(collection=collection)
        collection_son['sessions'] = sessions.to_son(only_fields=('label', 'type'))
        return collection_son

    def put(self, collection):
        abort(501)  # Not Implemented

    def delete(self, collection):
        abort(501)  # Not Implemented


################################################################################
class CollectionAccessAPI(AccessAPIResource):
    @security.AdminCollectionRequirement.protected
    def get(self, collection):
        return super(CollectionAccessAPI, self).get(collection)

    @security.AdminCollectionRequirement.protected
    def put(self, collection):
        return super(CollectionAccessAPI, self).put(collection)


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
                 methods=('GET', 'PUT'))
