# coding=utf-8

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('GroupListAPI', 'GroupItemAPI')


################################################################################
class GroupListAPI(ListAPIResource):
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
        return dict(groups=groups.to_son(only_fields=('label',)))

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


################################################################################
class GroupItemAPI(ItemAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, group):
        group_son = group.to_son()
        group_son['users'] = models.User.objects(groups=group).to_son(only_fields=('full_name', 'email'))
        # group_son['permissions'] = list(group.permissions)
        return dict(groups=[group_son])

    def put(self, group):
        abort(501)  # Not Implemented

    def patch(self, group):
        abort(501)  # Not Implemented

    def delete(self):
        abort(501)  # Not Implemented


################################################################################
api.add_resource(GroupListAPI,
                 '/groups',
                 endpoint='group_list',
                 methods=('GET', 'POST'))

api.add_resource(GroupItemAPI,
                 '/groups/<Group:group>',
                 endpoint='group_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))
