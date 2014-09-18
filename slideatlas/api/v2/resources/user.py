# coding=utf-8

from flask import request, make_response
from flask.json import jsonify

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('UserListAPI', 'UserItemAPI')


################################################################################
class UserListAPI(ListAPIResource):
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


################################################################################
class UserItemAPI(ItemAPIResource):
    @security.AdminSiteRequirement.protected
    def get(self, user):
        user_son = user.to_son(exclude_fields=('current_login_ip', 'last_login_ip', 'password', 'groups'),
                               include_empty=False)

        user_son['groups'] = [group.to_son(only_fields=('label',)) for group in user.groups]
        user_son['type'] = user._class_name
        return jsonify(users=[user_son])

    def put(self, user):
        abort(501)  # Not Implemented

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
                elif op_type == 'remove':
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
api.add_resource(UserListAPI,
                 '/users',
                 endpoint='user_list',
                 methods=('GET', 'POST'))

api.add_resource(UserItemAPI,
                 '/users/<User:user>',
                 endpoint='user_item',
                 methods=('GET', 'PUT', 'PATCH', 'DELETE'))
