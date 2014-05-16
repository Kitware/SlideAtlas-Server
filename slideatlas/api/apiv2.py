# coding=utf-8

import datetime
import math
import mimetypes

from bson import Binary
from flask import Blueprint, abort, current_app, make_response, request, url_for
from flask.helpers import wrap_file
from flask.json import jsonify
from flask.views import MethodView
from werkzeug.http import parse_content_range_header
import gridfs

from slideatlas import models, security

################################################################################
#TODO
# from flask.json import JSONDecoder

mod = Blueprint('apiv2', __name__,
                url_prefix='/apiv2',
                template_folder='templates',
                static_folder='static',
                )


################################################################################
class API(MethodView):
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
class DatabaseListAPI(ListAPI):
    def get(self):
        databases = models.ImageStore.objects
        return jsonify(databases=databases.to_son(only_fields=('label', 'dbname')))

    def post(self):
        abort(501)  # Not Implemented


class DatabaseItemAPI(ItemAPI):
    @security.AdminDatabasePermission.protected
    def get(self, database):
        return jsonify(databases=[database.to_son(exclude_fields=('username', 'password', 'auth_db'))])

    def put(self, database):
        abort(501)  # Not Implemented

    def patch(self, database):
        abort(501)  # Not Implemented

    def delete(self):
        abort(501)  # Not Implemented


################################################################################
class RoleListAPI(ListAPI):
    @security.AdminSitePermission.protected
    def get(self):
        filter_type = request.args.get('type')
        if filter_type == 'group':
            roles = models.GroupRole.objects
        elif filter_type == 'user':
            roles = models.UserRole.objects
        else:
            roles = models.Role.objects

        filter_can_see = request.args.get('can_see')
        filter_can_admin = request.args.get('can_admin')
        if filter_can_see and filter_can_admin:
            abort(400)  # Bad Request
        if filter_can_see:
            database = models.ImageStore.objects.get_or_404(id=request.args.get('db'))
            with database:
                session = models.Session.objects.get_or_404(id=filter_can_see)
            roles = [role for role in roles if role.can_see_session(session)]
        elif filter_can_admin:
            database = models.ImageStore.objects.get_or_404(id=request.args.get('db'))
            with database:
                session = models.Session.objects.get_or_404(id=filter_can_admin)
            roles = [role for role in roles if role.can_admin_session(session)]
        else:
            roles = list(roles)

        roles = [role.to_son(exclude_fields=('can_see', 'can_see_all', 'db_admin', 'site_admin')) for role in roles]
        return jsonify(roles=roles)

    @security.AdminSitePermission.protected
    def post(self):
        request_args = request.args.to_json()
        if ('users' in request_args) and ('create_group' in request_args):
            abort(400)  # Bad Request

        if 'users' in request_args:
            roles = list()
            for user_id in request_args['users']:
                # TODO: make this a single bulk query
                user = models.User.objects.get_or_404(id=user_id)
                if not user.user_role:
                    user.user_role = models.UserRole(
                        name=user.full_name,
                    )
                    # TODO: if there's a failure later in the function, the new user role will remain unused and empty
                    user.save()
                roles.append(user.user_role)
        elif 'create_group' in request_args:
            role = models.GroupRole(
                db=request_args['create_group']['db'],
                name=request_args['create_group']['name'],
                description=request_args['create_group'].get('description', ''),
                facebook_id=request_args['create_group'].get('facebook_id'),
            )
            roles = [role]
        else:
            abort(400)  # Bad Request

        for role in roles:
            for permission_request in request_args['permissions']:
                if permission_request['operation'] == 'grant':
                    if permission_request['permission'] == 'site_admin':
                        role.site_admin = True
                    elif permission_request['permission'] == 'db_admin':
                        role.db_admin = True
                    elif permission_request['permission'] == 'can_see_all':
                        role.can_see_all = True
                    elif permission_request['permission'] == 'can_see':
                        database_id = permission_request['db']
                        session_id = permission_request['session']
                        if session_id not in role.can_see:
                            database = models.ImageStore.objects.get_or_404(id=database_id)
                            with database:
                                session = models.Session.objects.get_or_404(id=session_id)
                            role.can_see.append(session.id)
                elif permission_request['operation'] == 'revoke':
                    if permission_request['permission'] == 'site_admin':
                        role.site_admin = False
                    elif permission_request['permission'] == 'db_admin':
                        role.db_admin = False
                    elif permission_request['permission'] == 'can_see_all':
                        role.can_see_all = False
                    elif permission_request['permission'] == 'can_see':
                        session_id = permission_request['session']
                        try:
                            role.can_see.remove(session_id)
                        except ValueError:
                            abort(400)  # Bad Request
                    else:
                            abort(400)  # Bad Request
                else:
                    abort(400)  # Bad Request

        # only save after everything has been updated, to make failure atomic
        for role in roles:
            role.save()

        return make_response(jsonify(roles=[role.to_son() for role in roles]),
                             201,  # Created
                             {'Location': url_for('role_item', role=role)})


class RoleItemAPI(ItemAPI):
    @security.AdminSitePermission.protected
    def get(self, role):
        return jsonify(roles=[role.to_son()])

    def put(self, role):
        abort(501)  # Not Implemented

    def patch(self, role):
        abort(501)  # Not Implemented

    def delete(self):
        abort(501)  # Not Implemented


################################################################################
class UserListAPI(ListAPI):
    @security.AdminSitePermission.protected
    def get(self):
        users = models.User.objects
        return jsonify(users=users.to_son(only_fields=('full_name', 'email')))

    def post(self):
        abort(501)  # Not Implemented


class UserItemAPI(ItemAPI):
    @security.AdminSitePermission.protected
    def get(self, user):
        user_son = user.to_son(exclude_fields=('current_login_ip', 'last_login_ip', 'password', 'roles'),
                               include_empty=False)

        user_son['roles'] = {
            'user_role': user.user_role.to_son(only_fields=('name',)) if user.user_role else None,
            'group_roles': [role.to_son(only_fields=('name',)) for role in user.group_roles]
        }
        user_son['type'] = user._class_name
        return jsonify(users=[user_son])

    def put(self, user):
        abort(501)  # Not Implemented

    def patch(self, user):
        """
        To update a user's data:

        Send a PATCH request with a "Content-Type: application/json" header to
        the endpoint: "/apiv2/users/<user_id

        The body of the patch request must be:
        [
          { "op": "add", "path": "/<field_name>", "value": "<new_value>" },
          ...
        ]

        <field_name> is the name of a user item's data field, as returned
        by a corresponding GET request. Note the leading "/" on the name of the
        field. Nested fields and arrays are not yet supported.

        <new_value> is the new value that the field should take.

        Multiple fields may be changed, by including multiple {"op"...} items
        in the top-level list.

        A successful request will return 204 (No Content). Unsuccessful requests
        will return a 4xx status code.
        """
        return self._do_patch(user)

    def delete(self, user):
        abort(501)  # Not Implemented


class UserRoleListAPI(ListAPI):
    def get(self, user):
        abort(501)  # Not Implemented

    def post(self, user):
        abort(501)  # Not Implemented


class UserRoleItemAPI(ItemAPI):
    def get(self, user):
        abort(501)  # Not Implemented

    @security.AdminSitePermission.protected
    def put(self, user, role):
        if isinstance(role, models.UserRole):
            abort(409)  # Conflict

        if role in user.roles:
            return make_response('', 204)  # No Content
        else:
            user.roles.append(role)
        user.save()
        # TODO: return the new user roles
        return make_response('', 200)  # OK

    def patch(self, user, role):
        abort(405)  # Method Not Allowed

    @security.AdminSitePermission.protected
    def delete(self, user, role):
        if isinstance(role, models.UserRole):
            abort(409)  # Conflict

        try:
            user.roles.remove(role)
        except ValueError:
            abort(404)
        user.save()
        return make_response('', 204)  # No Content


################################################################################
class SessionListAPI(ListAPI):
    @security.AdminDatabasePermission.protected
    def get(self, database):
        # TODO: currently, session administrative access is all-or-nothing on
        #   the database level, but it should be made granular

        only_fields=('name', 'label', 'type')

        with database:
            sessions = models.Session.objects.only(*only_fields)

        return jsonify(sessions=sessions.to_son(only_fields=only_fields))

    def post(self, database):
        abort(501)  # Not Implemented


class SessionItemAPI(ItemAPI):
    @security.AdminDatabasePermission.protected
    def get(self, database, session):
        with database:
            image_only_fields = ('name', 'label', 'type', 'filename')
            image_ids = [image_ref.ref for image_ref in session.images]
            images_bulk_query = models.Image.objects.only(*image_only_fields).in_bulk(image_ids)
            images_son = list()
            for image_ref in session.images:
                # TODO: some references are dangling, so catch the exception
                try:
                    image_son = images_bulk_query[image_ref.ref].to_son(only_fields=image_only_fields)
                except KeyError:
                    image_son = {'id': image_ref.ref}
                image_son['hide'] = image_ref.hide
                images_son.append(image_son)

            view_only_fields = ('label', 'type', 'type2', 'title', 'hidden_title', 'text')
            view_ids = [view_ref.ref for view_ref in session.views]
            views_bulk_query = models.View.objects.only(*view_only_fields).in_bulk(view_ids)
            views_son = list()
            for view_ref in session.views:
                try:
                    view_son = views_bulk_query[view_ref.ref].to_son(only_fields=view_only_fields)
                except KeyError:
                    view_son = {'id': view_ref.ref}
                view_son['hide'] = view_ref.hide
                views_son.append(view_son)

        session_son = session.to_son(exclude_fields=('images', 'views'))
        # TODO: hide
        session_son['images'] = images_son
        session_son['views'] = views_son
        session_son['attachments'] = SessionAttachmentListAPI._get(database, session)

        return jsonify(sessions=[session_son])

    def put(self, database, session):
        abort(501)  # Not Implemented

    def patch(self, database, session):
        abort(501)  # Not Implemented

    def delete(self, database, session):
        abort(501)  # Not Implemented


################################################################################
class SessionAttachmentListAPI(ListAPI):
    @staticmethod
    def _get(database, session):
        attachments_fs = gridfs.GridFS(database.to_pymongo(raw_object=True), 'attachments')

        attachments = list()
        for attachment_ref in session.attachments:
            attachment_obj = attachments_fs.get(attachment_ref.ref)
            attachments.append({
                'id': attachment_ref.ref,
                'name': attachment_obj.name,
                'length' : attachment_obj.length
            })
        return attachments


    @security.ViewSessionPermission.protected
    def get(self, database, session):
        attachments = self._get(database, session)
        return jsonify(attachments=attachments)


    @security.AdminSessionPermission.protected
    def post(self, database, session):
        # only accept a single file from a form
        if len(request.files.items(multi=True)) != 1:
            abort(400)  # Bad Request
        uploaded_file = request.files.itervalues().next()

        gridfs_args = dict()

        # file name
        if not uploaded_file.filename:
            # the uploaded file must contain a filename
            abort(400)
        # TODO: filter the filename to remove special characters and ensure length < 255
        gridfs_args['filename'] = uploaded_file.filename

        # chunked uploads
        content_range = parse_content_range_header(request.headers.get('Content-Range'))
        if content_range and (content_range.stop != content_range.length):
            if content_range.start != 0:
                # a POST with partial content must not contain a fragment past the start of the entity
                abort(400)  # Bad Request
            if content_range.units != 'bytes':
                # only a range-unit of "bytes" may be used in a Content-Range header
                abort(400)  # Bad Request
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
        attachments_fs = gridfs.GridFS(database.to_pymongo(raw_object=True), 'attachments')
        attachment = attachments_fs.new_file(**gridfs_args)
        try:
            # this will stream the IO, instead of loading it all into memory
            uploaded_file.save(attachment)
        finally:
            attachment.close()
            uploaded_file.close()

        # add to session
        attachments_ref = models.RefItem(ref=attachment._id)
        session.attachments.append(attachments_ref)
        session.save()

        # return response
        new_location = url_for('.session_attachment_item', database=database,
                               session=session, attachment_id=attachment._id)
        return make_response(jsonify(),  # TODO: return body with metadata?
                             201,  # Created
                             {'Location': new_location})


class SessionAttachmentItemAPI(ItemAPI):
    @security.ViewSessionPermission.protected
    def get(self, database, session, attachment_id):
        attachments_fs = gridfs.GridFS(database.to_pymongo(raw_object=True), 'attachments')
        try:
            attachment = attachments_fs.get(attachment_id)
        except gridfs.NoFile:
            abort(404)

        # check that the requested attachment is in the session
        for attachment_ref in session.attachments:
            if attachment_ref.ref == attachment._id:
                break
        else:
            abort(404)  # Not Found

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
        response.content_md5 = attachment.md5
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


    @security.AdminSessionPermission.protected
    def put(self, database, session, attachment_id):
        attachments_fs = gridfs.GridFS(database.to_pymongo(raw_object=True), 'attachments')
        try:
            attachment = attachments_fs.get(attachment_id)
        except gridfs.NoFile:
            abort(404)

        # only accept a single file from a form
        if len(request.files.items(multi=True)) != 1:
            abort(400)  # Bad Request
        uploaded_file = request.files.itervalues().next()

        content_range = parse_content_range_header(request.headers.get('Content-Range'))
        if not content_range:
            # a PUT request to modify an attachment must include a Content-Range header
            abort(400)
        if content_range.units != 'bytes':
            # only a range-unit of "bytes" may be used in a Content-Range header
            abort(400)  # Bad Request
        if content_range.start is None:
            # the content's start and end positions must be specified in the Content-Range header
            abort(400)
        # 'parse_content_range_header' guarantees that 'content_range.stop' must
        #   also be specified if 'start' is
        if content_range.length is None:
            # the content's total length must be specified in the Content-Range header
            # TODO: getting rid of this restriction would be nice, but we'd need
            #   a way to know when the final chunk was uploaded
            abort(400)

        content_chunk_size = content_range.stop - content_range.start
        if content_range.start % content_chunk_size != 0:
            # upload content start location must be a multiple of content chunk size
            abort(400)

        if (content_chunk_size != attachment.chunkSize) and (content_range.stop != content_range.length):
            # only the end chunk can be shorter
            # upload content chunk size does not match existing GridFS chunk size
            abort(400)

        database_pymongo = database.to_pymongo()

        chunk_num = (content_range.start / attachment.chunkSize)
        database_pymongo['attachments.chunks'].insert({
            'files_id': attachment._id,
            'n': chunk_num,
            'data': Binary(uploaded_file.read()),
        })

        # chunks may be sent out of order, so the only way to determine if all
        #   chunks were received is to count
        expected_chunks = int(math.ceil(float(content_range.length) / float(attachment.chunkSize)))
        received_chunks = database_pymongo['attachments.chunks'].find({'files_id': attachment._id}).count()
        if expected_chunks == received_chunks:
            # update the attachment metadata
            md5 = database_pymongo.command('filemd5', attachment._id, root='attachments')['md5']
            database_pymongo['attachments.files'].update(
                {'_id': attachment._id},
                {'$set': {
                    'length': content_range.length,
                    'md5': md5,
                    'uploadDate': datetime.datetime.utcnow()
                    }}
            )

        return make_response(jsonify(), 204)  # No Content


    def patch(self, database, session, attachment_id):
        abort(405)  # Method Not Allowed


    @security.AdminSessionPermission.protected
    def delete(self, database, session, attachment_id):
        attachments_fs = gridfs.GridFS(database.to_pymongo(raw_object=True), 'attachments')
        try:
            attachment = attachments_fs.get(attachment_id)
        except gridfs.NoFile:
            abort(404)  # Not Found

        # delete from session
        for (pos, attachment_ref) in enumerate(session.attachments):
            if attachment_ref.ref == attachment._id:
                session.attachments.pop(pos)
                session.save()
                break
        else:
            abort(404)  # Not Found

        # delete from attachments collection
        attachments_fs.delete(attachment._id)

        return make_response('', 204)  # No Content


################################################################################
mod.add_url_rule('/databases',
                 view_func=DatabaseListAPI.as_view('database_list'),
                 methods=['GET', 'POST'])

mod.add_url_rule('/databases/<Database:database>',
                 view_func=DatabaseItemAPI.as_view('database_item'),
                 methods=['GET', 'PUT', 'PATCH', 'DELETE'])

mod.add_url_rule('/roles',
                 view_func=RoleListAPI.as_view('role_list'),
                 methods=['GET', 'POST'])

mod.add_url_rule('/roles/<Role:role>',
                 view_func=RoleItemAPI.as_view('role_item'),
                 methods=['GET', 'PUT', 'PATCH', 'DELETE'])

mod.add_url_rule('/users',
                 view_func=UserListAPI.as_view('user_list'),
                 methods=['GET', 'POST'])

mod.add_url_rule('/users/<User:user>',
                 view_func=UserItemAPI.as_view('user_item'),
                 methods=['GET', 'PUT', 'PATCH', 'DELETE'])

mod.add_url_rule('/users/<User:user>/roles',
                 view_func=UserRoleListAPI.as_view('user_role_list'),
                 methods=['GET', 'POST'])

mod.add_url_rule('/users/<User:user>/roles/<Role:role>',
                 view_func=UserRoleItemAPI.as_view('user_role_item'),
                 methods=['GET', 'PUT', 'PATCH', 'DELETE'])

mod.add_url_rule('/<Database:database>/sessions',
                 view_func=SessionListAPI.as_view('session_list'),
                 methods=['GET', 'POST'])

mod.add_url_rule('/<Database:database>/sessions/<Session:session>',
                 view_func=SessionItemAPI.as_view('session_item'),
                 methods=['GET', 'PUT', 'PATCH', 'DELETE'])

mod.add_url_rule('/<Database:database>/sessions/<Session:session>/attachments',
                 view_func=SessionAttachmentListAPI.as_view('session_attachment_list'),
                 methods=['GET', 'POST'])

mod.add_url_rule('/<Database:database>/sessions/<Session:session>/attachments/<ObjectId:attachment_id>',
                 view_func=SessionAttachmentItemAPI.as_view('session_attachment_item'),
                 methods=['GET', 'PUT', 'PATCH', 'DELETE'])
