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
    @staticmethod
    def _fetch_view(session, view_id):
        # find the requested view in the session
        if view_id not in session.views:
            abort(404, details='The requested view was not found in the requested session.')

        admin_db = models.ImageStore._get_db()
        view = admin_db['views'].find_one({'_id': view_id})
        return view

    @security.ViewSessionRequirement.protected
    def get(self, session, view_id):
        view = self._fetch_view(session, view_id)
        if not view:
            abort(404, details='The requested view was not found.')
        view['id'] = view.pop('_id')
        return view

    def put(self, session, view_id):
        abort(501)  # Not Implemented

    @staticmethod
    def _delete(view_id):
        """
        Internal helper to delete a view and all of its children.

        TODO: this should be moved to the View model
        """
        admin_db = models.ImageStore._get_db()
        view = admin_db['views'].find_one({'_id': view_id})
        # TODO: verify that the view actually exists; but don't enable until
        #   the database is cleaned of broken links
        if view:
            for child in view.get('Children', list()):
                SessionViewItemAPI._delete(ObjectId(child))
            admin_db['views'].remove({'_id': view_id})

    @security.EditSessionRequirement.protected
    def delete(self, session, view_id):
        # delete from session
        try:
            session.views.remove(view_id)
        except ValueError:
            abort(404, details='The requested view was not found in the requested session.')
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
