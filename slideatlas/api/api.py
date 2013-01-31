"""
rest api for administrative interface
refer to documentation
"""

from flask import Blueprint, render_template, request, url_for, current_app
from bson import ObjectId
from slideatlas import slconn as conn
from slideatlas import model
from slideatlas import common_utils
from celery.platforms import resource



mod = Blueprint('api', __name__,
                url_prefix="/apiv1"
                )

# The url valid for databases, rules and users with supported queries

@mod.route('/test')
@mod.route('/test/<regex("[a-f0-9]{24}"):resid>')
def test(resid=None):
    return "TEST %s" % (resid)


@mod.route('/<regex("(databases|users|rules)"):restype>', defaults={"resid" : None})
@mod.route('/<regex("(databases|users|rules)"):restype>'
                        '/<regex("[a-f0-9]{24}"):resid>')
#@mod.route('/<regex("[a-f0-9]{24}"):resid>', defaults={"restype" : None})
def admin_db_request(restype, resid):
    """
        /apiv1/users/5074589002e31023d4292d83
        /apiv1/users/5074589002e31023d4292d83
    """

    # See if the user is requesting any session id
    return "you want : %s, %s" % (restype, resid)

