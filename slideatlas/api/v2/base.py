# coding=utf-8

from collections import defaultdict

from bson import ObjectId
from bson.errors import InvalidId
from flask import request
from flask.ext.restful import Resource

from slideatlas import models, security
from .common import abort, output_json

################################################################################
__all__ = ()


################################################################################
class APIResource(Resource):
    representations = {
        'application/json': output_json,
    }
    method_decorators = [security.login_required]


class ListAPIResource(APIResource):
    def get(self, *args):
        abort(501)  # Not Implemented

    def post(self, *args):
        abort(501)  # Not Implemented


class ItemAPIResource(APIResource):
    def get(self, *args):
        abort(501)  # Not Implemented

    def put(self, *args):
        abort(501)  # Not Implemented

    def delete(self, *args):
        abort(501)  # Not Implemented


class AccessAPIResource(APIResource):
    def get(self, resource):
        users = models.User.objects(permissions__resource_id=resource.id).\
            only('full_name', 'email', 'permissions').order_by('full_name')
        def _to_user_son(user):
            user_son = user.to_son(only_fields=())
            user_son['label'] = user.label
            user_son['level'] = str(max(permission.operation
                                        for permission in user.permissions
                                        if permission.resource_id == resource.id))
            return user_son
        users_son = map(_to_user_son, users)

        groups = models.Group.objects(permissions__resource_id=resource.id).\
            only('label', 'permissions').order_by('label')
        def _to_group_son(group):
            group_son = group.to_son(only_fields=('label',))
            group_son['level'] = str(max(permission.operation
                                        for permission in group.permissions
                                        if permission.resource_id == resource.id))
            return group_son
        groups_son = map(_to_group_son, groups)

        return dict(users=users_son, groups=groups_son)

    def put(self, resource):
        request_json = request.get_json()
        if request_json is None:
            abort(415)  # Unsupported Media Type

        def _update_access(entity_type='users', entity_model=models.User):
            try:
                entity_access_list = request_json[entity_type]
            except KeyError:
                abort(400, details='The request is missing the "%s" field.' % entity_type)
            if not isinstance(entity_access_list, list):
                abort(400, details='The request\'s "%s" field must be an array.' % entity_type)

            entities_by_operation = defaultdict(list)
            for entity_access_item in entity_access_list:
                if not isinstance(entity_access_item, dict):
                    abort(400, details='The request\'s "%s" field must contain objects.' % entity_type)
                try:
                    operation = getattr(models.Operation, entity_access_item['level'])
                except (KeyError, TypeError, AttributeError):
                    abort(400, details='The request\'s "%s" fields\' "level" fields must be valid access level / operation types.' % entity_type)
                try:
                    entity = ObjectId(entity_access_item['_id'])
                except (KeyError, InvalidId):
                    abort(400, details='The request\'s "%s" fields\' "_id" fields must be valid ObjectIds.' % entity_type)
                entities_by_operation[operation].append(entity)

            entity_model.objects(permissions__resource_id=resource.id)\
                .update(pull__permissions__resource_id=resource.id)
            for operation, entities in entities_by_operation.iteritems():
                permission = models.PermissionDocument(
                    operation=operation,
                    resource_type=resource._types[0].lower(),
                    resource_id=resource.id)
                entity_model.objects(id__in=entities)\
                    .update(push__permissions=permission)

        _update_access('users', models.User)
        _update_access('groups', models.Group)
