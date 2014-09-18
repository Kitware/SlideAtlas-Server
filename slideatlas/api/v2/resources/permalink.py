# coding=utf-8

from bson import ObjectId
from bson.errors import InvalidId
from flask import request, url_for
from flask.json import jsonify

from slideatlas import models, security
from ..base import ListAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('PermalinkListAPI', )


################################################################################
class PermalinkListAPI(ListAPIResource):
    # @security.AdminSiteRequirement.protected
    # def get(self):
    #     abort(501)  # Not Implemented

    def post(self):
        try:
            view_id = ObjectId(request.form.get('view'))
            destination = request.form.get('destination')
        except (KeyError, InvalidId):
            abort(400)  # Bad Request

        try:
            permalink = models.Permalink.objects.get(view=view_id)
        except models.DoesNotExist:
            permalink = models.Permalink(
                destination=destination,
                view=view_id,
                created_by=security.current_user._get_current_object()
            )
            permalink.save()
        except models.MultipleObjectsReturned:
            # TODO: should not happen, log and recover
            raise

        permalink_son = permalink.to_son()
        permalink_son['url'] = url_for('link', code=permalink.code, _external=True)

        # TODO: make 201 Created / 303 See Other
        # TODO: add Location header
        return jsonify(permalinks=permalink_son)


################################################################################
api.add_resource(PermalinkListAPI,
                 '/permalinks',
                 endpoint='permalink_list',
                 methods=('GET', 'POST'))
