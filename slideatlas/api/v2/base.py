# coding=utf-8

from flask.ext.restful import Resource

from slideatlas import security
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

    def patch(self, *args):
        abort(501)  # Not Implemented

    def delete(self, *args):
        abort(501)  # Not Implemented
