# coding=utf-8

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('GroupListAPI', 'GroupItemAPI')


################################################################################
class GroupListAPI(ListAPIResource):
    @security.AdminRequirement.protected
    def get(self):
        groups = models.Group.objects.only('label').order_by('label')
        return groups.to_son(only_fields=('label',))

    def post(self):
        abort(501)  # Not Implemented


################################################################################
class GroupItemAPI(ItemAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, group):
        group_son = group.to_son()
        group_son['users'] = models.User.objects(groups=group).to_son(only_fields=('full_name', 'email'))
        return group_son

    def put(self, group):
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
                 methods=('GET', 'PUT', 'DELETE'))
