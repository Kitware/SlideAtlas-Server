# coding=utf-8

from collections import defaultdict
from itertools import groupby, izip

from bson import ObjectId
from flask import request, url_for, current_app

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource, AccessAPIResource
from ..blueprint import api
from ..common import abort
from .file import SessionAttachmentListAPI, SessionAttachmentItemAPI
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
        admindb = models.ImageStore._get_db()

        # pre-lookup views, image stores, and images in bulk for speed
        # TODO: some of this could eventually be merged with the main loop, once
        #   models are used
        # TODO: change to an "in_bulk" lookup, once view models are used
        known_views = admindb['views'].find({'_id': {'$in': session.views}})
        views_by_id = {view['_id']: view for view in known_views}

        known_image_id_pairs = set()
        for view in views_by_id.itervalues():
            try:
                image_store_id = view['ViewerRecords'][0]['Database']
                image_id = view['ViewerRecords'][0]['Image']
            except (KeyError, IndexError):
                continue
            known_image_id_pairs.add((image_store_id, image_id))

        known_image_store_ids = set(image_store_id for image_store_id, image_id in known_image_id_pairs)
        image_stores_by_id = models.ImageStore.objects.in_bulk(list(known_image_store_ids))

        images_by_id = {
            image['_id']: image
            for image_store_id, image_id_pairs
            in groupby(sorted(known_image_id_pairs),
                       lambda image_id_pair: image_id_pair[0])
            for image
            in image_stores_by_id[image_store_id].to_pymongo()['images'].find(
                {'_id': {'$in': zip(*image_id_pairs)[1]}},
                {'thumb': False})
        }

        # build the actual list to be returned
        views_son = list()
        for view_id in session.views:
            try:
                view = views_by_id[view_id]
            except KeyError:
                current_app.logger.error('Session %s references a missing view: %s', session.id, view_id)
                continue

            try:
                image_store_id = view['ViewerRecords'][0]['Database']
                image_id = view['ViewerRecords'][0]['Image']
            except (KeyError, IndexError):
                current_app.logger.error('View %s does not contain any valid image reference', view_id)
                continue

            # get 'image'
            image = images_by_id.get(image_id)
            if not image:
                current_app.logger.error('View %s references a missing image: %s/%s', view_id, image_store_id, image_id)
                continue

            # determine if view is hidden and will be skipped
            if view.get('hide', False) or image.get('hide', False):
                continue

            # get 'view_label' and 'view_hidden_label'
            if 'Title' in view:
                view_label = view['Title']
            elif 'label' in view:
                view_label = view['label']
            elif 'label' in image:
                view_label = image['label']
            else:
                current_app.logger.warning('View %s has no label set or inherited', view_id)
                view_label = ""
            view_hidden_label = view.get('HiddenTitle', '')

            # set 'ajax_view_item' and 'ajax_view_items' for output
            view_son = {
                'Type': view.get('Type'),
                'id': view_id,
                'label': view_label,
                'image_id': image_id,
                'image_store_id': image_store_id,
            }
            if with_hidden_label:
                view_son['label'] = view_label
                view_son['hidden_label'] = view_hidden_label
            else:
                view_son['label'] = view_label if not session.hide_annotations else view_hidden_label
            views_son.append(view_son)

        session_son = session.to_son(exclude_fields=('views', 'attachments'))
        session_son['views'] = views_son

        session_son['attachments'] = SessionAttachmentListAPI._get(session, 'attachments')
        session_son['imagefiles'] = session.get_imagefiles()

        return session_son

    @security.ViewSessionRequirement.protected
    def get(self, session):
        return dict(sessions=[self._get(session)])

    def put(self, session):
        abort(501)  # Not Implemented

    @security.AdminSessionRequirement.protected
    def delete(self, session):
        for view_id in session.views:
            SessionViewItemAPI._delete(view_id)

        # TODO: A helper method can avoid duplication
        for attachment_ref in session.attachments:
            attachment_id = attachment_ref.ref
            # TODO: this is slow, as the session is re-saved as each attachment
            #   is deleted; this should be refactored to delete all attachments
            #   at once, without updating the session
            SessionAttachmentItemAPI().delete(session, "attachments", attachment_id)

        for imagefile_ref in session.imagefiles:
            imagefile_id = imagefile_ref.ref
            # TODO: this is slow, as the session is re-saved as each attachment
            #   is deleted; this should be refactored to delete all attachments
            #   at once, without updating the session
            SessionAttachmentItemAPI().delete(session, "imagefiles", imagefile_id)

        models.User.objects(permissions__resource_id=session.id)\
            .update(pull__permissions__resource_id=session.id)
        models.Group.objects(permissions__resource_id=session.id)\
            .update(pull__permissions__resource_id=session.id)

        session.delete()
        return None, 204  # No Content


################################################################################
class SessionAccessAPI(AccessAPIResource):
    @security.AdminSessionRequirement.protected
    def get(self, session):
        return super(SessionAccessAPI, self).get(session)

    @security.AdminSessionRequirement.protected
    def put(self, session):
        return super(SessionAccessAPI, self).put(session)


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
                 methods=('GET', 'PUT'))
