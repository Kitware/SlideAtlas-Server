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
        """
        Internal helper to delete a view and all of its children.

        TODO: this should be moved to the View model
        """
        admin_db = models.ImageStore._get_db()
        view = admin_db['views'].find_one({'_id': view_id})
        if view:
            for child in view.get('Children', list()):
                SessionViewItemAPI._delete(ObjectId(child))
            admin_db['views'].remove({'_id': view_id})

    @security.EditSessionRequirement.protected
    def delete(self, session, view_id):
        # TODO: verify that the view actually exists; but don't enable until
        #   the database is cleaned of broken links

        # delete from session
        for (pos, view_ref) in enumerate(session.views):
            if view_ref.ref == view_id:
                session.views.pop(pos)
                break
        session.save()

        # delete from views collection
        self._delete(view_id)

        return None, 204  # No Content


################################################################################
api.add_resource(SessionViewListAPI,
                 '/sessions/<Session:session>/views',
                 endpoint='session_view_list',
                 methods=('GET', 'POST'))

api.add_resource(SessionViewItemAPI,
                 '/sessions/<Session:session>/views/<ObjectId:view_id>',
                 endpoint='session_view_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))
