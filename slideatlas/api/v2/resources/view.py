# coding=utf-8

from bson import ObjectId

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('SessionViewListAPI', 'SessionViewItemAPI')


################################################################################
class SessionViewListAPI(ListAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, session):
        abort(501)  # Not Implemented

    def post(self, session):
        abort(501)  # Not Implemented


################################################################################
class SessionViewItemAPI(ItemAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, session, view_id):
        abort(501)  # Not Implemented

    def put(self, session, view_id):
        abort(501)  # Not Implemented

    def patch(self, session, view_id):
        abort(501)  # Not Implemented

    @staticmethod
    def _delete(view_id):
        view_id = ObjectId(view_id)
        admin_db = models.ImageStore._get_db()
        view = admin_db['views'].find_one({'_id': view_id})
        if view:
            for child in view.get('Children', list()):
                SessionViewItemAPI._delete(child)
            admin_db['views'].remove({'_id': view_id})

    def delete(self, session, view_id):
        abort(501)  # Not Implemented


################################################################################
api.add_resource(SessionViewListAPI,
                 '/sessions/<Session:session>/views',
                 endpoint='session_view_list',
                 methods=('GET', 'POST'))

api.add_resource(SessionViewItemAPI,
                 '/sessions/<Session:session>/views/<ObjectId:view_id>',
                 endpoint='session_view_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))
