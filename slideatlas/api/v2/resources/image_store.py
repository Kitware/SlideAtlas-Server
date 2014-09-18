# coding=utf-8

from flask import make_response
from flask.json import jsonify

from slideatlas import models, security
from ..base import APIResource, ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('ImageStoreListAPI',
           'ImageStoreListSyncAPI', 'ImageStoreListDeliverAPI',
           'ImageStoreItemAPI',
           'ImageStoreItemSyncAPI', 'ImageStoreItemDeliverAPI')


################################################################################
class ImageStoreListAPI(ListAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self):
        image_stores = models.ImageStore.objects.order_by('label')
        return jsonify(image_stores=image_stores.to_son(only_fields=('label',)))

    def post(self):
        abort(501)  # Not Implemented


################################################################################
class ImageStoreListSyncAPI(APIResource):
    @security.AdminSiteRequirement.protected
    def post(self):
        for image_store in models.PtiffImageStore.objects.order_by('label'):
            image_store.sync()
        return make_response('', 204)  # No Content


################################################################################
class ImageStoreListDeliverAPI(APIResource):
    @security.AdminSiteRequirement.protected
    def post(self):
        for image_store in models.PtiffImageStore.objects.order_by('label'):
            image_store.deliver()
        return make_response('', 204)  # No Content


################################################################################
class ImageStoreItemAPI(ItemAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, image_store):
        return jsonify(image_stores=[image_store.to_son()])

    def put(self, collection):
        abort(501)  # Not Implemented

    def patch(self, collection):
        abort(501)  # Not Implemented

    def delete(self):
        abort(501)  # Not Implemented


################################################################################
class ImageStoreItemSyncAPI(APIResource):
    @security.AdminSiteRequirement.protected
    def post(self, image_store):
        if not isinstance(image_store, models.PtiffImageStore):
            abort(410, details='Only Ptiff ImageStores may be synced.')  # Gone
        image_store.sync()
        return make_response('', 204)  # No Content


################################################################################
class ImageStoreItemDeliverAPI(APIResource):
    @security.AdminSiteRequirement.protected
    def post(self, image_store):
        if not isinstance(image_store, models.PtiffImageStore):
            abort(410, details='Only Ptiff ImageStores may be delivered.')  # Gone
        image_store.deliver()
        return make_response('', 204)  # No Content


################################################################################
api.add_resource(ImageStoreListAPI,
                 '/imagestores',
                 endpoint='image_store_list',
                 methods=('GET', 'POST'))

api.add_resource(ImageStoreListSyncAPI,
                 '/imagestores/sync',
                 endpoint='image_store_list_sync',
                 methods=('POST',))

api.add_resource(ImageStoreListDeliverAPI,
                 '/imagestores/deliver',
                 endpoint='image_store_list_deliver',
                 methods=('POST',))

api.add_resource(ImageStoreItemAPI,
                 '/imagestores/<ImageStore:image_store>',
                 endpoint='image_store_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))

api.add_resource(ImageStoreItemSyncAPI,
                 '/imagestores/<ImageStore:image_store>/sync',
                 endpoint='image_store_item_sync',
                 methods=('POST',))

api.add_resource(ImageStoreItemDeliverAPI,
                 '/imagestores/<ImageStore:image_store>/deliver',
                 endpoint='image_store_item_deliver',
                 methods=('POST',))
