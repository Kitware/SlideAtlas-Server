# coding=utf-8

from flask import Blueprint, abort, current_app, make_response, request, url_for
from flask.helpers import wrap_file
from flask.json import jsonify
from flask.views import MethodView
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


################################################################################
class DatabaseListAPI(ListAPI):
    def get(self):
        databases = models.Database.objects
        return jsonify(databases=databases.to_son(exclude_fields=('username', 'password', 'auth_db')))

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
            database = models.Database.objects.get_or_404(id=request.args.get('db'))
            with database:
                session = models.Session.objects.get_or_404(id=filter_can_see)
            roles = [role for role in roles if role.can_see_session(session)]
        elif filter_can_admin:
            database = models.Database.objects.get_or_404(id=request.args.get('db'))
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
                            database = models.Database.objects.get_or_404(id=database_id)
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
        user_son = user.to_son(exclude_fields=('current_login_ip', 'last_login_ip', 'password', 'roles'))

        user_son['roles'] = {
            'user_role': user.user_role.to_son(only_fields=('name',)) if user.user_role else None,
            'group_roles': [role.to_son(only_fields=('name',)) for role in user.group_roles]
        }
        user_son['type'] = user._class_name
        return jsonify(users=[user_son])

    def put(self, user):
        abort(501)  # Not Implemented

    def patch(self, user):
        abort(501)  # Not Implemented

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
        attachments_fs = gridfs.GridFS(database.to_pymongo(raw_object=True), 'attachments')

        # TODO: chucked uploads

        # only accept a single file from a form
        if len(request.files.items(multi=True)) != 1:
            abort(400)  # Bad Request

        uploaded_file = request.files.itervalues().next()
        attachment = attachments_fs.new_file(
            filename=uploaded_file.filename,
            # TODO: detection of 'content_type', possibly with libmagic
            content_type=uploaded_file.content_type
        )
        try:
            uploaded_file.save(attachment)
        finally:
            attachment.close()
            uploaded_file.close()

        attachments_ref = models.RefItem(id=attachment._id)
        session.attachments.append(attachments_ref)
        session.save()

        # TODO: return Location: redirect header
        # TODO: return body with metadata
        return make_response('', 201)  # Created


class SessionAttachmentItemAPI(ItemAPI):
    @security.ViewSessionPermission.protected
    def get(self, database, session, attachment_id):
        attachments_fs = gridfs.GridFS(database.to_pymongo(raw_object=True), 'attachments')

        # check that the requested attachment is in the session
        for attachment_ref in session.attachments:
            if attachment_ref.ref == attachment_id:
                break
        else:
            abort(404)  # Not Found

        attachment = attachments_fs.get(attachment_id)

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
            direct_passthrough=True,
            content_type=(attachment.content_type or 'application/octet-stream'))
        response.content_length = attachment.length
        response.content_md5 = attachment.md5
        # TODO: can an 'inline' download of an HTML-ish file be exploited for XSS?
        #   an 'attachment' download can be used for XSS with a client-local context
        #   http://www.gnucitizen.org/blog/content-disposition-hacking/
        content_disposition = dict()
        if attachment.filename:
            content_disposition['filename'] = attachment.filename
        response.headers.set('Content-Disposition', 'inline', **content_disposition) # RFC 6266

        response.last_modified = attachment.upload_date
        response.set_etag(attachment.md5)
        response.cache_control.public = True
        response.cache_control.max_age = current_app.get_send_file_max_age(None)

        # TODO: call '.make_conditional(request)' as a post-request processor
        return response.make_conditional(request)


    def put(self, database, session, attachment_id):
        abort(405)  # Method Not Allowed

    def patch(self, database, session, attachment_id):
        abort(405)  # Method Not Allowed

    @security.AdminSessionPermission.protected
    def delete(self, database, session, attachment_id):
        attachments_fs = gridfs.GridFS(database.to_pymongo(raw_object=True), 'attachments')

        # delete from session
        for (pos, attachment_ref) in enumerate(session.attachments):
            if attachment_ref.ref == attachment_id:
                session.attachments.pop(pos)
                session.save()
                break
        else:
            abort(404)  # Not Found

        # delete from attachments collection
        attachments_fs.delete(attachment_id)

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
