# coding=utf-8

from flask import Blueprint
from flask.ext.restful import Api

################################################################################
__all__ = ('blueprint', )


################################################################################
blueprint = Blueprint('apiv2', __name__,
                      url_prefix='/api'
                      )


################################################################################
# ideally, the Api's initialization would be deferred until the blueprint is
#   registered with the app; however, Flask-Restful has a deep bug where
#   endpoints that are registered with a deferred blueprint actually get
#   attached directly to the app
api = Api(blueprint,
          prefix='/v2',
          catch_all_404s=False,  # TODO: do we want this?
          default_mediatype='application/json',
          )
# TODO: explicitly set 'config["ERROR_404_HELP"] = True'
