"""
rest api for administrative interface
refer to documentation
"""

from flask import Blueprint, render_template, request, url_for, current_app
from flask.views import MethodView
from bson import ObjectId
from slideatlas import slconn as conn
from slideatlas import model
from slideatlas import common_utils
from celery.platforms import resource



mod = Blueprint('api', __name__,
                url_prefix="/apiv1"
                )

# The url valid for databases, rules and users with supported queries
class AdminDBAPI(MethodView):
    def get(self, restype, resid):
        if resid == None:
            return "You want alist of %s" % (restype)
        else:
            if restype == "attachments":
                return "You want %s, %s" % (restype, resid)
            else:
                return "You want %s, %s" % (restype, resid)

    def post(self, restype):
        # create a new user
        pass

    def delete(self, restype, resid):
        # delete a single user
        pass

    def put(self, restype, resid):
        # update a single user
        pass

mod.add_url_rule('/<regex("(databases|users|rules)"):restype>', defaults={"resid" : None}, view_func=AdminDBAPI.as_view("show_resources"))
mod.add_url_rule('/<regex("(databases|users|rules)"):restype>/<regex("[a-f0-9]{24}"):resid>', view_func=AdminDBAPI.as_view("show_resources"))

#@mod.route('/<regex("(databases|users|rules)"):restype>', defaults={"resid" : None})
#@mod.route('/<regex("(databases|users|rules)"):restype>'
#                        '/<regex("[a-f0-9]{24}"):resid>')
##@mod.route('/<regex("[a-f0-9]{24}"):resid>', defaults={"restype" : None})
#def admin_db_request(restype, resid):
#    """
#        /apiv1/users/5074589002e31023d4292d83
#        /apiv1/databases
#        /apiv1/rules/5074589002e31023d4292d83
#    """
#
#    # See if the user is requesting any session id
#    return "you want : %s, %s" % (restype, resid)









# Specially for session

# For a list of sessions 
@mod.route('/<regex("[a-f0-9]{24}"):dbid>'
                        '/sessions', defaults={"resid" : None, "restype" : None, "sessid" : None})

# For a particular session (May not be needed)
@mod.route('/<regex("[a-f0-9]{24}"):dbid>'
                        '/sessions'
                        '/<regex("[a-f0-9]{24}"):sessid>', defaults={"resid" : None, "restype" : None})

# For a list of resources within session
@mod.route('/<regex("[a-f0-9]{24}"):dbid>'
                        '/sessions'
                        '/<regex("[a-f0-9]{24}"):sessid>'
                        '/<regex("(attachments|views)"):restype>', defaults={"resid" : None})

# For a list of resources within session
@mod.route('/<regex("[a-f0-9]{24}"):dbid>'
                        '/sessions'
                        '/<regex("[a-f0-9]{24}"):sessid>'
                        '/<regex("(attachments|views)"):restype>'
                        '/<regex("[a-f0-9]{24}"):resid>')

def session_object_request(dbid, sessid, restype, resid):
    """
                                    "/apiv1/5074589002e31023d4292d83/sessions",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83",

                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/views",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/views/5074589002e31023d4292d83",

                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/attachments",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/attachments/5074589002e31023d4292d83",
    """
    # See if the user is requesting any session id
    return "you want : %s, %s, %s, %s" % (dbid, sessid, restype, resid)

