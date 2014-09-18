# coding=utf-8

from flask.views import MethodView

from .common import abort

################################################################################
__all__ = ()


################################################################################
class APIResource(MethodView):
    # TODO make this a Flask-RESTful 'Resource' subclass
    pass


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
