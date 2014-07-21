# coding=utf-8

import datetime
from itertools import ifilter
import math
import mimetypes

from bson import Binary, ObjectId
from flask import Blueprint, abort, current_app, make_response, request, url_for
from flask.helpers import wrap_file
from flask.json import jsonify
from flask.views import MethodView
from flask.ext.restful import Api
from werkzeug.http import parse_content_range_header
import gridfs

from slideatlas import models, security

################################################################################
#TODO
# from flask.json import JSONDecoder

from flask.ext.restful import abort as restful_abort
from flask.ext.restful.utils import error_data
def abort(http_status_code, details=None):
    """
    Return an error response, with the given 'http_status_code' and a JSON body.

    Optionally, supplemental 'details' may be provided, which will be included
    with the response body.

    This function provides the same {'status', 'message'} response body as
    Flask-Restful, but also allows an optional 'details' field to be added.
    """
    data = error_data(http_status_code)
    if details:
        data['details'] = details
    restful_abort(http_status_code, **data)



################################################################################
class API(MethodView):
    # TODO make this a Flask-RESTful 'Resource' subclass
    pass


class ListAPI(API):
    def get(self):
        abort(501)  # Not Implemented

    def post(self):
        abort(501)  # Not Implemented


class ItemAPI(API):
    def get(self):
        abort(501)  # Not Implemented

    def put(self):
        abort(501)  # Not Implemented

    def patch(self):
        abort(501)  # Not Implemented

    def delete(self):
        abort(501)  # Not Implemented

    def _get_item(self, document, **kwargs):
        return jsonify(document.to_son(**kwargs))

    def _do_patch(self, document):
        patch_request = request.get_json()
        # 'get_json' will raise a 400 error if the request cannot be parsed,
        #   and will return none if it does not have 'application/json' as a
        #   Content-Type
        # TODO: allow 'application/json-patch+json' Content-Type per RFC 6902
        if patch_request is None:
            abort(415)  # Unsupported Media Type

        try:
            if not isinstance(patch_request, list):
                raise ValueError('PATCH requests must be in a JSON list')

            for operation in patch_request:
                op_type = operation['op'].lower()

                # TODO: make fully compliant with RFC 6901
                path = tuple(operation['path'].split('/')[1:])

                if op_type == 'add':
                    value = operation['value']
                    if len(path) == 0:
                        # operation on whole document
                        abort(501)  # Not Implemented
                    elif len(path) == 1:
                        # use of __setitem__ on a model document validates the
                        #   field's existence and will raise a KeyError if it
                        #   doesn't exist
                        try:
                            document[path[0]] = value
                        except KeyError:
                            abort(422)  # Unprocessable Entity
                    else:
                        # operation on nested member
                        abort(501)  # Not Implemented
                elif op_type =='remove':
                    if len(path) == 0:
                        # operation on whole document
                        abort(501)  # Not Implemented
                    elif len(path) == 1:
                        try:
                            document[path[0]] = None
                        except KeyError:
                            abort(422)  # Unprocessable Entity
                    else:
                        # operation on nested member
                        abort(501)  # Not Implemented
                elif op_type == 'replace':
                    abort(501)  # Not Implemented
                elif op_type == 'move':
                    abort(501)  # Not Implemented
                elif op_type == 'copy':
                    abort(501)  # Not Implemented
                elif op_type == 'test':
                    abort(501)  # Not Implemented
                else:
                    raise ValueError('Unsupported op type: "%s"' % operation['op'])

                document.validate()

        except (KeyError, ValueError, models.ValidationError):
            # TODO: return error details with response
            abort(400)  # Bad Request

        document.save()

        return make_response('', 204)  # No Content


################################################################################
class UserListAPI(ListAPI):
    @security.AdminSiteRequirement.protected
    def get(self):
        users_son = list()
        # TODO: order by 'label', rather than 'full_name'?
        # TODO: order by last name?
        # TODO: order case-insensitively
        for user in models.User.objects.order_by('full_name'):
            user_son = user.to_son(only_fields=('type', ))
            user_son['label'] = user.label
            users_son.append(user_son)
        return jsonify(users=users_son)

    def post(self):
        abort(501)  # Not Implemented


class UserItemAPI(ItemAPI):
    @security.AdminSiteRequirement.protected
    def get(self, user):
        user_son = user.to_son(exclude_fields=('current_login_ip', 'last_login_ip', 'password', 'groups'),
                               include_empty=False)

        user_son['groups'] = [group.to_son(only_fields=('label',)) for group in user.groups]
        user_son['type'] = user._class_name
        return jsonify(users=[user_son])

    def put(self, user):
        abort(501)  # Not Implemented

    @security.AdminSiteRequirement.protected
    def patch(self, user):
        """
        To update a user's data, following RFC 6902:

        Send a PATCH request with a "Content-Type: application/json" header to
        the endpoint: "/apiv2/users/<user_id

        The body of the patch request must follow:
        [
          { "op": "add", "path": "/<field_name>", "value": "<new_value>" },
          { "op": "remove",  "path": "/<field_name>" },
          ...
        ]

        Only the "add" and "remove" operations are supported currently. "add"
        sets a field, and "remove" unsets a field.

        <field_name> is the name of a user item's data field, as returned
        by a corresponding GET request. Note the leading "/" on the name of the
        field. Nested fields and arrays are not yet supported.

        <new_value> is the new value that the field should take, and only is
        required for the "add" operation.

        Multiple fields may be changed, by including multiple {"op"...} items
        in the top-level list.

        A successful request will return 204 (No Content). Unsuccessful requests
        will return a 4xx status code.
        """
        return self._do_patch(user)

    def delete(self, user):
        abort(501)  # Not Implemented


################################################################################
class GroupListAPI(ListAPI):
    @security.AdminSiteRequirement.protected
    def get(self):
        # filter_can_see = request.args.get('can_see')
        # filter_can_admin = request.args.get('can_admin')
        # if filter_can_see and filter_can_admin:
        #     abort(400)  # Bad Request
        # if filter_can_see:
        #     database = models.ImageStore.objects.get_or_404(id=request.args.get('db'))
        #     with database:
        #         session = models.Session.objects.get_or_404(id=filter_can_see)
        #     roles = [role for role in roles if role.can_see_session(session)]
        # elif filter_can_admin:
        #     database = models.ImageStore.objects.get_or_404(id=request.args.get('db'))
        #     with database:
        #         session = models.Session.objects.get_or_404(id=filter_can_admin)
        #     roles = [role for role in roles if role.can_admin_session(session)]
        # else:
        #     roles = list(roles)
        groups = models.Group.objects.order_by('label')
        return jsonify(groups=groups.to_son(only_fields=('label',)))

    @security.AdminSiteRequirement.protected
    def post(self):
        abort(501)  # Not Implemented
        # request_args = request.args.to_json()
        # if ('users' in request_args) and ('create_group' in request_args):
        #     abort(400)  # Bad Request
        #
        # if 'users' in request_args:
        #     roles = list()
        #     for user_id in request_args['users']:
        #         # TODO: make this a single bulk query
        #         user = models.User.objects.get_or_404(id=user_id)
        #         if not user.user_role:
        #             user.user_role = models.UserRole(
        #                 name=user.full_name,
        #             )
        #             # TODO: if there's a failure later in the function, the new user role will remain unused and empty
        #             user.save()
        #         roles.append(user.user_role)
        # elif 'create_group' in request_args:
        #     role = models.Group(
        #         db=request_args['create_group']['db'],
        #         name=request_args['create_group']['name'],
        #         description=request_args['create_group'].get('description', ''),
        #         facebook_id=request_args['create_group'].get('facebook_id'),
        #     )
        #     roles = [role]
        # else:
        #     abort(400)  # Bad Request
        #
        # for role in roles:
        #     for permission_request in request_args['permissions']:
        #         if permission_request['operation'] == 'grant':
        #             if permission_request['permission'] == 'site_admin':
        #                 role.site_admin = True
        #             elif permission_request['permission'] == 'db_admin':
        #                 role.db_admin = True
        #             elif permission_request['permission'] == 'can_see_all':
        #                 role.can_see_all = True
        #             elif permission_request['permission'] == 'can_see':
        #                 database_id = permission_request['db']
        #                 session_id = permission_request['session']
        #                 if session_id not in role.can_see:
        #                     database = models.ImageStore.objects.get_or_404(id=database_id)
        #                     with database:
        #                         session = models.Session.objects.get_or_404(id=session_id)
        #                     role.can_see.append(session.id)
        #         elif permission_request['operation'] == 'revoke':
        #             if permission_request['permission'] == 'site_admin':
        #                 role.site_admin = False
        #             elif permission_request['permission'] == 'db_admin':
        #                 role.db_admin = False
        #             elif permission_request['permission'] == 'can_see_all':
        #                 role.can_see_all = False
        #             elif permission_request['permission'] == 'can_see':
        #                 session_id = permission_request['session']
        #                 try:
        #                     role.can_see.remove(session_id)
        #                 except ValueError:
        #                     abort(400)  # Bad Request
        #             else:
        #                     abort(400)  # Bad Request
        #         else:
        #             abort(400)  # Bad Request
        #
        # # only save after everything has been updated, to make failure atomic
        # for role in roles:
        #     role.save()
        #
        # return make_response(jsonify(roles=[role.to_son() for role in roles]),
        #                      201,  # Created
        #                      {'Location': url_for('role_item', role=role)})


class GroupItemAPI(ItemAPI):
    @security.AdminSiteRequirement.protected
    def get(self, group):
        group_son = group.to_son()
        group_son['users'] = models.User.objects(groups=group).to_son(only_fields=('full_name', 'email'))
        # group_son['permissions'] = list(group.permissions)
        return jsonify(groups=[group_son])

    def put(self, group):
        abort(501)  # Not Implemented

    def patch(self, group):
        abort(501)  # Not Implemented

    def delete(self):
        abort(501)  # Not Implemented


################################################################################
class ImageStoreListAPI(ListAPI):
    @security.AdminSiteRequirement.protected
    def get(self):
        image_stores = models.ImageStore.objects.order_by('label')
        return jsonify(image_stores=image_stores.to_son(only_fields=('label',)))

    def post(self):
        abort(501)  # Not Implemented


class ImageStoreListSyncAPI(API):
    @security.AdminSiteRequirement.protected
    def post(self):
        for image_store in models.PtiffImageStore.objects.order_by('label'):
            image_store.sync()
        return make_response('', 204)  # No Content


class ImageStoreListDeliverAPI(API):
    @security.AdminSiteRequirement.protected
    def post(self):
        for image_store in models.PtiffImageStore.objects.order_by('label'):
            image_store.deliver()
        return make_response('', 204)  # No Content


class ImageStoreItemAPI(ItemAPI):
    @security.AdminSiteRequirement.protected
    def get(self, image_store):
        return jsonify(image_stores=[image_store.to_son()])

    def put(self, collection):
        abort(501)  # Not Implemented

    def patch(self, collection):
        abort(501)  # Not Implemented

    def delete(self):
        abort(501)  # Not Implemented


class ImageStoreItemSyncAPI(API):
    @security.AdminSiteRequirement.protected
    def post(self, image_store):
        if not isinstance(image_store, models.PtiffImageStore):
            abort(410, details='Only Ptiff ImageStores may be synced.')  # Gone
        image_store.sync()
        return make_response('', 204)  # No Content


class ImageStoreItemDeliverAPI(API):
    @security.AdminSiteRequirement.protected
    def post(self, image_store):
        if not isinstance(image_store, models.PtiffImageStore):
            abort(410, details='Only Ptiff ImageStores may be delivered.')  # Gone
        image_store.deliver()
        return make_response('', 204)  # No Content


################################################################################
class CollectionListAPI(ListAPI):
    @security.AdminSiteRequirement.protected
    def get(self):
        collections = models.Collection.objects.order_by('label')
        return jsonify(collections=collections.to_son(only_fields=('label',)))

    def post(self):
        abort(501)  # Not Implemented


class CollectionItemAPI(ItemAPI):
    @security.AdminSiteRequirement.protected
    def get(self, collection):
        collection_son = collection.to_son()
        sessions = models.Session.objects(collection=collection)
        collection_son['sessions'] = sessions.to_son(only_fields=('name', 'label', 'type'))
        return jsonify(collections=[collection_son])

    def put(self, collection):
        abort(501)  # Not Implemented

    def patch(self, collection):
        abort(501)  # Not Implemented

    def delete(self):
        abort(501)  # Not Implemented


class CollectionAccessAPI(API):
    @security.AdminCollectionRequirement.protected
    def get(self, collection):
        groups = models.Group.objects(permissions__resource_type='collection',
                                      permissions__resource_id=collection.id
                                     ).order_by('label')

        return jsonify(users=[], groups=groups.to_son(only_fields=('label',)))

    @security.AdminCollectionRequirement.protected
    def post(self, collection):
        abort(501)  # Not Implemented


################################################################################
class SessionListAPI(ListAPI):
    @security.AdminSiteRequirement.protected
    def get(self):
        # TODO: currently, session administrative access is all-or-nothing on
        #   the database level, but it should be made granular

        only_fields=('name', 'label', 'type')

        sessions = models.Session.objects.only(*only_fields).order_by('label')

        return jsonify(sessions=sessions.to_son(only_fields=only_fields))

    def post(self):
        abort(501)  # Not Implemented


class SessionItemAPI(ItemAPI):
    @staticmethod
    def _get(session, with_hidden_label=False):
        unique_image_store_ids = set(ifilter(None, (view_ref.db for view_ref in session.views)))
        image_stores_by_id = models.ImageStore.objects.in_bulk(list(unique_image_store_ids))
        image_stores_by_id[session.image_store.id] = session.image_store

        # iterate through the session objects
        views_son = list()
        for view_ref in session.views:
            view_image_store_id = view_ref.db or session.image_store.id
            view_image_store = image_stores_by_id[view_image_store_id].to_pymongo()

            view_id = view_ref.ref
            view = view_image_store['views'].find_one({'_id': view_id})
            if not view:
                # TODO: warning here
                continue

            # get 'image_id' and 'image_image_store_id'
            image_image_store_id = view_image_store_id
            if view.get('Type') == 'Note':
                record = view['ViewerRecords'][0]
                if isinstance(record['Image'], dict):
                    image_id = ObjectId(record['Image']['_id'])
                    image_image_store_id = ObjectId(record['Image']['database'])
                else :
                    image_id = ObjectId(record["Image"])
                if 'Database' in record:
                    image_image_store_id = ObjectId(record['Database'])
            else:
                image_id = ObjectId(view['img'])
            if 'imgdb' in view:
                image_image_store_id = ObjectId(view['imgdb'])

            # get 'image'
            if image_image_store_id not in image_stores_by_id:
                image_stores_by_id[image_image_store_id] = models.ImageStore.objects.get(id=image_image_store_id)
            image_image_store = image_stores_by_id[image_image_store_id].to_pymongo()
            image = image_image_store['images'].find_one({'_id': image_id}, {'thumb': False})

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
                'image_store_id': view_image_store_id,
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
        return jsonify(sessions=[self._get(session)])

    def put(self, session):
        abort(501)  # Not Implemented

    def patch(self, session):
        abort(501)  # Not Implemented

    def delete(self, session):
        abort(501)  # Not Implemented


class SessionAccessAPI(API):
    @security.AdminSessionRequirement.protected
    def get(self, session):
        groups = models.Group.objects(permissions__resource_type='session',
                                      permissions__resource_id=session.id
                                     ).order_by('label')

        return jsonify(users=[], groups=groups.to_son(only_fields=('label',)))

    @security.AdminCollectionRequirement.protected
    def post(self, collection):
        abort(501)  # Not Implemented


################################################################################
class SessionAttachmentListAPI(ListAPI):
    @staticmethod
    def _get(session):
        # look up image stores once in bulk for efficiency
        unique_image_store_ids = set(ifilter(None, (attachment_ref.db for attachment_ref in session.attachments)))
        image_stores_by_id = models.ImageStore.objects.in_bulk(list(unique_image_store_ids))

        attachments = list()
        for attachment_ref in session.attachments:
            image_store = image_stores_by_id[attachment_ref.db]
            attachments_fs = gridfs.GridFS(image_store.to_pymongo(raw_object=True), 'attachments')

            attachment_obj = attachments_fs.get(attachment_ref.ref)
            attachments.append({
                'id': attachment_obj._id,
                'name': attachment_obj.name,
                'length' : attachment_obj.length
            })

        return attachments


    @security.ViewSessionRequirement.protected
    def get(self, session):
        attachments = self._get(session)
        return jsonify(attachments=attachments)


    @security.AdminSessionRequirement.protected
    def post(self, session):
        if len(request.files.items(multi=True)) != 1:
            abort(400, details='Exactly one file must be provided.')
        uploaded_file = request.files.itervalues().next()

        gridfs_args = dict()

        # file name
        if not uploaded_file.filename:
            abort(400, details='The file must contain a filename.')
        # TODO: filter the filename to remove special characters and ensure length < 255
        gridfs_args['filename'] = uploaded_file.filename

        # chunked uploads
        content_range = parse_content_range_header(request.headers.get('Content-Range'))
        if content_range and (content_range.stop != content_range.length):
            if content_range.start != 0:
                abort(400, details='A POST with partial content must not contain a fragment past the start of the entity.')
            if content_range.units != 'bytes':
                abort(400, details='Only a range-unit of "bytes" may be used in a Content-Range header.')
            content_chunk_size = content_range.stop - content_range.start
            gridfs_args['chunkSize'] = content_chunk_size

        # content type
        # TODO: get the content type via libmagic, so a client can't falsify it
        #   via headers or filename extension
        # TODO: reject dangerous file types, like .exe or .html
        # first, try the client's headers for content type
        if uploaded_file.mimetype and uploaded_file.mimetype != 'application/octet-stream':
            # "mimetype" doesn't include charset options
            gridfs_args['contentType'] = uploaded_file.mimetype
        else:
            # if the headers are non-specific, try the filename extension
            extension_content_type = mimetypes.guess_type(uploaded_file.filename, strict=False)[0]
            if extension_content_type:
                gridfs_args['contentType'] = extension_content_type
        # if getting the content type failed, leave "gridfs_args['contentType']" unset

        # save into GridFS
        image_store = session.collection.image_store
        attachments_fs = gridfs.GridFS(image_store.to_pymongo(raw_object=True), 'attachments')
        attachment = attachments_fs.new_file(**gridfs_args)
        try:
            # this will stream the IO, instead of loading it all into memory
            uploaded_file.save(attachment)
        finally:
            attachment.close()
            uploaded_file.close()

        # add to session
        attachments_ref = models.RefItem(ref=attachment._id, db=image_store.id)
        session.attachments.append(attachments_ref)
        session.save()

        # return response
        new_location = url_for('.session_attachment_item', session=session,
                               attachment_id=attachment._id)
        return make_response(jsonify(),  # TODO: return body with metadata?
                             201,  # Created
                             {'Location': new_location})


class SessionAttachmentItemAPI(ItemAPI):

    @staticmethod
    def _fetch_attachment(session, attachment_id):
        # find the requested attachment in the session
        for attachment_ref in session.attachments:
            if attachment_ref.ref == attachment_id:
                break
        else:
            abort(404, details='The requested attachment was not found in the requested session.')

        # use 'get' instead of 'with_id', so an exception will be thrown if not found
        image_store = models.ImageStore.objects.get(id=attachment_ref.db)

        attachments_fs = gridfs.GridFS(image_store.to_pymongo(raw_object=True), 'attachments')
        try:
            attachment = attachments_fs.get(attachment_id)
        except gridfs.NoFile:
            abort(404, details='The requested attachment was not found in the requested session\'s image store.')

        return image_store, attachments_fs, attachment


    @security.ViewSessionRequirement.protected
    def get(self, session, attachment_id):
        attachment = self._fetch_attachment(session, attachment_id)[2]

        # Note: Returning the attachment with 'flask.send_file' would typically
        #   be adequate. However, 'attachment' is an instance of 'GridOut',
        #   which implements a read-only 'file' property (properties cannot be
        #   overridden in instances, not even by directly setting '__dict__').
        #   Because the 'attachment' has a 'file' attribute, 'flask.send_file'
        #   erroneously will treat it like an actual file with a location on the
        #   local filesystem. Rather than wrap the entire 'GridOut' instance to
        #   get rid of a single property, just create the response explicitly,
        #   which gives more control anyway.

        response = current_app.response_class(
            response=wrap_file(request.environ, attachment),
            direct_passthrough=True, # allows HEAD method to work without reading the attachment's data
            content_type=(attachment.content_type or 'application/octet-stream'))
        response.content_length = attachment.length
        response.content_md5 = attachment.md5.decode('hex').encode('base64').rstrip()
        # TODO: can an 'inline' download of an HTML-ish file be exploited for XSS?
        #   an 'attachment' download can be used for XSS with a client-local context
        #   http://www.gnucitizen.org/blog/content-disposition-hacking/
        content_disposition = dict()
        if attachment.filename:
            content_disposition['filename'] = attachment.filename
        # TODO: make 'attachment' if file is a very large image
        response.headers.set('Content-Disposition', 'inline', **content_disposition) # RFC 6266

        response.last_modified = attachment.upload_date
        response.set_etag(attachment.md5)
        response.cache_control.public = True
        response.cache_control.max_age = current_app.get_send_file_max_age(None)

        # TODO: call '.make_conditional(request)' as a post-request processor
        return response.make_conditional(request)


    @security.AdminSessionRequirement.protected
    def put(self, session, attachment_id):
        image_store, _, attachment = self._fetch_attachment(session, attachment_id)

        # only accept a single file from a form
        if len(request.files.items(multi=True)) != 1:
            abort(400, details='Exactly one file must be provided.')
        uploaded_file = request.files.itervalues().next()

        content_range = parse_content_range_header(request.headers.get('Content-Range'))
        if not content_range:
            abort(400, details='A PUT request to modify an attachment must include a Content-Range header.')
        if content_range.units != 'bytes':
            abort(400, details='Only a range-unit of "bytes" may be used in a Content-Range header.')
        if content_range.start is None:
            abort(400, details='The content\'s start and end positions must be specified in the Content-Range header.')
        # 'parse_content_range_header' guarantees that 'content_range.stop' must
        #   also be specified if 'start' is
        if content_range.length is None:
            # TODO: getting rid of this restriction would be nice, but we'd need
            #   a way to know when the final chunk was uploaded
            abort(400, details='The content\'s total length must be specified in the Content-Range header.')

        if content_range.start % attachment.chunkSize != 0:
            abort(400, details='The content\'s start location must be a multiple of the content\'s chunk size.')

        content_chunk_size = content_range.stop - content_range.start
        if (content_chunk_size != attachment.chunkSize) and (content_range.stop != content_range.length):
            # only the end chunk can be shorter
            abort(400, details='Upload content chunk size does not match existing GridFS chunk size.')

        image_store_pymongo = image_store.to_pymongo()

        chunk_num = (content_range.start / attachment.chunkSize)
        image_store_pymongo['attachments.chunks'].insert({
            'files_id': attachment._id,
            'n': chunk_num,
            'data': Binary(uploaded_file.read()),
        })

        # chunks may be sent out of order, so the only way to determine if all
        #   chunks were received is to count
        expected_chunks = int(math.ceil(float(content_range.length) / float(attachment.chunkSize)))
        received_chunks = image_store_pymongo['attachments.chunks'].find({'files_id': attachment._id}).count()
        if expected_chunks == received_chunks:
            # update the attachment metadata
            md5 = image_store_pymongo.command('filemd5', attachment._id, root='attachments')['md5']
            image_store_pymongo['attachments.files'].update(
                {'_id': attachment._id},
                {'$set': {
                    'length': content_range.length,
                    'md5': md5,
                    'uploadDate': datetime.datetime.utcnow()
                    }}
            )

        return make_response(jsonify(), 204)  # No Content


    @security.AdminSessionRequirement.protected
    def delete(self, session, attachment_id):
        # this also ensures that the attachment actually exists
        attachments_fs = self._fetch_attachment(session, attachment_id)[1]

        # delete from session
        for (pos, attachment_ref) in enumerate(session.attachments):
            if attachment_ref.ref == attachment_id:
                session.attachments.pop(pos)
                break
        session.save()

        # delete from attachments collection
        attachments_fs.delete(attachment_id)

        return make_response('', 204)  # No Content


################################################################################

# TODO: verify __name__ as 'import_name'
blueprint = Blueprint('apiv2', __name__,
                      url_prefix='/api'
                      )


def register_with_app(app):
    app.register_blueprint(blueprint)

api = Api(blueprint,
          prefix='/v2',
          decorators=[security.login_required],
          catch_all_404s=False, # TODO: do we want this?
          )
# TODO: explicitly set 'config["ERROR_404_HELP"] = True'


api.add_resource(UserListAPI,
                 '/users',
                 endpoint='user_list',
                 methods=('GET', 'POST'))

api.add_resource(UserItemAPI,
                 '/users/<User:user>',
                 endpoint='user_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))

api.add_resource(GroupListAPI,
                 '/groups',
                 endpoint='group_list',
                 methods=('GET', 'POST'))

api.add_resource(GroupItemAPI,
                 '/groups/<Group:group>',
                 endpoint='group_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))

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

api.add_resource(SessionAttachmentListAPI,
                 '/sessions/<Session:session>/attachments',
                 endpoint='session_attachment_list',
                 methods=('GET', 'POST'))

api.add_resource(SessionAttachmentItemAPI,
                 '/sessions/<Session:session>/attachments/<ObjectId:attachment_id>',
                 endpoint='session_attachment_item',
                 methods=('GET', 'PUT', 'DELETE'))  # PATCH not allowed
