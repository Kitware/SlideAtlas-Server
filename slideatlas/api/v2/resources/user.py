# coding=utf-8

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('UserListAPI', 'UserItemAPI')


################################################################################
class UserListAPI(ListAPIResource):
    @security.AdminRequirement.protected
    def get(self):
        # TODO: order by 'label', rather than 'full_name'?
        # TODO: order by last name?
        # TODO: order case-insensitively
        users = models.User.objects.only('full_name', 'email').order_by('full_name')
        def _to_user_son(user):
            user_son = user.to_son(only_fields=())
            user_son['label'] = user.label
            return user_son
        return map(_to_user_son, users)

    def post(self):
        abort(501)  # Not Implemented


################################################################################
class UserItemAPI(ItemAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, user):
        user_son = user.to_son(exclude_fields=('current_login_ip', 'last_login_ip', 'password', 'groups'),
                               include_empty=False)
        user_son['groups'] = [group.to_son(only_fields=('label',)) for group in user.groups]
        user_son['type'] = user._class_name
        return user_son

    def put(self, user):
        abort(501)  # Not Implemented

    def delete(self, user):
        abort(501)  # Not Implemented


################################################################################
api.add_resource(UserListAPI,
                 '/users',
                 endpoint='user_list',
                 methods=('GET', 'POST'))

api.add_resource(UserItemAPI,
                 '/users/<User:user>',
                 endpoint='user_item',
                 methods=('GET', 'PUT', 'DELETE'))
