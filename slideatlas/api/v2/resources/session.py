# coding=utf-8

from itertools import ifilter

from bson import ObjectId
from flask import request, url_for

from slideatlas import models, security
from ..base import APIResource, ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort
from .attachment import SessionAttachmentListAPI, SessionAttachmentItemAPI
from .view import SessionViewItemAPI

################################################################################
__all__ = ('SessionListAPI', 'SessionItemAPI', 'SessionAccessAPI')


################################################################################
class SessionListAPI(ListAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self):
        # TODO: currently, session administrative access is all-or-nothing on
        #   the database level, but it should be made granular

        only_fields=('label', 'type')

        sessions = models.Session.objects.only(*only_fields).order_by('label')

        return dict(sessions=sessions.to_son(only_fields=only_fields))

    def post(self):
        """
        Create a session.

        The request should be of type 'application/json', not
        'application/x-www-form-urlencoded'.

        The request must be of the format:
          {
            "collection": "0123456789abcdef01234567",
            "label" : "New Session Name"
          }
        """
        request_json = request.get_json()
        if request_json is None:
            abort(415)  # Unsupported Media Type

        try:
            collection_id = request_json['collection']
            session_label = request_json['label']
        except KeyError as e:
            abort(400, details='The request is missing the "%s" field.' % e.message)  # TODO

        collection = models.Collection.objects.get_or_404(id=collection_id)
        security.AdminCollectionRequirement(collection).test()

        session = models.Session(collection=collection, image_store=collection.image_store, label=session_label)
        try:
            session.save()
        except models.ValidationError as e:
            abort(400, details='The new session was invalid because: %s' % e.message)

        new_location = url_for('.session_item', session=session)
        return (None,  # TODO: return body with metadata?
                201,  # Created
                {'Location': new_location})


################################################################################
class SessionItemAPI(ItemAPIResource):
    @staticmethod
    def _get(session, with_hidden_label=False):
        unique_image_store_ids = set(ifilter(None, (view_ref.db for view_ref in session.views)))
        image_stores_by_id = models.ImageStore.objects.in_bulk(list(unique_image_store_ids))
        image_stores_by_id[session.image_store.id] = session.image_store

        # iterate through the session objects
        views_son = list()
        for view_ref in session.views:
            admindb = models.ImageStore._get_db()

            view_id = view_ref.ref
            view = admindb['views'].find_one({'_id': view_id})
            #view = models.NewView.objects.get(id=view_id).to_mongo()
            if not view:
                continue

            # get 'image_id' and 'image_image_store_id'
            image_image_store_id = None
            if 'ViewerRecords' in view:
                record = view['ViewerRecords'][0]
                image_id = record["Image"]
                image_image_store_id = record['Database']
            else:
                image_id = ObjectId(view['img'])

            # These are legacy and will go away soon.
            if 'imgdb' in view:
                image_image_store_id = ObjectId(view['imgdb'])
            if 'db' in view:
                image_image_store_id = ObjectId(view['db'])

            # get 'image'
            if image_image_store_id not in image_stores_by_id:
                image_stores_by_id[image_image_store_id] = models.ImageStore.objects.get(id=image_image_store_id)
            image_image_store = image_stores_by_id[image_image_store_id].to_pymongo()
            image = image_image_store['images'].find_one({'_id': image_id}, {'thumb': False})

            if not image:
                continue

            # determine if view is hidden and will be skipped
            if view_ref.hide or view.get('hide', False) or image.get('hide', False):
                continue

            # get 'view_label' and 'view_hidden_label'
            if 'Title' in view:
                view_label = view['Title']
            elif view_ref.label:
                view_label = view_ref.label
            elif 'label' in view:
                view_label = view['label']
            elif 'label' in image:
                view_label = image['label']
            else:
                view_label = ""
            view_hidden_label = view.get('HiddenTitle', '')

            # set 'ajax_view_item' and 'ajax_view_items' for output
            view_son = {
                'id': view_id,
                'image_store_id': image_image_store_id,
                'label': view_label,
                'image_id': image_id,
                'image_image_store_id': image_image_store_id,
            }
            if with_hidden_label:
                view_son['label'] = view_label
                view_son['hidden_label'] = view_hidden_label
            else:
                view_son['label'] = view_label if not session.hide_annotations else view_hidden_label
            views_son.append(view_son)

        session_son = session.to_son(exclude_fields=('views', 'attachments'))
        session_son['views'] = views_son
        session_son['attachments'] = SessionAttachmentListAPI._get(session)

        return session_son

    @security.ViewSessionRequirement.protected
    def get(self, session):
        return dict(sessions=[self._get(session)])

    def put(self, session):
        abort(501)  # Not Implemented

    def patch(self, session):
        abort(501)  # Not Implemented

    @security.AdminSessionRequirement.protected
    def delete(self, session):
        for view_ref in session.views:
            view_id = view_ref.ref
            SessionViewItemAPI._delete(view_id)
        for attachment_ref in session.attachments:
            attachment_id = attachment_ref.ref
            # TODO: this is slow, as the session is re-saved as each attachment
            #   is deleted; this should be refactored to delete all attachments
            #   at once, without updating the session
            SessionAttachmentItemAPI().delete(session, attachment_id)
        models.User.objects(permissions__resource_id=session.id)\
            .update(pull__permissions__resource_id=session.id)
        models.Group.objects(permissions__resource_id=session.id)\
            .update(pull__permissions__resource_id=session.id)

        session.delete()
        return None, 204  # No Content


################################################################################
class SessionAccessAPI(APIResource):
    @security.EditSessionRequirement.protected
    def get(self, session):
        groups = models.Group.objects(permissions__resource_type='session',
                                      permissions__resource_id=session.id
                                     ).order_by('label')

        return dict(users=[], groups=groups.to_son(only_fields=('label',)))

    @security.EditCollectionRequirement.protected
    def post(self, collection):
        abort(501)  # Not Implemented


################################################################################
api.add_resource(SessionListAPI,
                 '/sessions',
                 endpoint='session_list',
                 methods=('GET', 'POST'))

api.add_resource(SessionItemAPI,
                 '/sessions/<Session:session>',
                 endpoint='session_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))

api.add_resource(SessionAccessAPI,
                 '/sessions/<Session:session>/access',
                 endpoint='session_access',
                 methods=('GET', 'POST'))
