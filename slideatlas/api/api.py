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
    decorators = [common_utils.user_required]

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
        if restype == "rules":
                return "You want to post rule"
        elif restype == 'databases':
                return "You want to add database"
        elif restype == 'users':
            # Posting to users means typically adding new rules to users
            return "You want to add database"

        pass

    def delete(self, restype, resid):
        # Verify the access
        # Remove one instance
        # and remove the given resource
        # Not implemented right now
        pass

    def put(self, restype, resid):
        # update some information
        pass

mod.add_url_rule('/<regex("(databases|users|rules)"):restype>', defaults={"resid" : None}, view_func=AdminDBAPI.as_view("show_resources"))
mod.add_url_rule('/<regex("(databases|users|rules)"):restype>/<regex("[a-f0-9]{24}"):resid>', view_func=AdminDBAPI.as_view("show_resources"))


# The url valid for databases, rules and users with supported queries
class DataSessionItemsAPI(MethodView):
    decorators = [common_utils.user_required]

    def get(self, dbid, sessid, restype, resid):
        if resid == None:
            return "You want alist of %s/%s/%s" % (dbid, sessid, restype)
        else:
            if restype == "attachments":
                return "You want list of attachments in %s/%s" % (dbid, sessid)
            else:
                return "You want list of views in %s/%s" % (dbid, sessid)


# For a list of resources within session
mod.add_url_rule('/<regex("[a-f0-9]{24}"):dbid>'
                                '/sessions'
                                '/<regex("[a-f0-9]{24}"):sessid>'
                                '/<regex("(attachments|views)"):restype>', view_func=DataSessionItemsAPI.as_view("show_session_item_list"), defaults={"resid" : None})

# Specially for session

# For a list of sessions 
mod.add_url_rule('/<regex("[a-f0-9]{24}"):dbid>'
                                '/sessions', view_func=DataSessionItemsAPI.as_view("show_session_list"), defaults={"resid" : None, "restype" : None, "sessid" : None})

# For a particular session (May not be needed)
@mod.route('/<regex("[a-f0-9]{24}"):dbid>'
                        '/sessions'
                        '/<regex("[a-f0-9]{24}"):sessid>', defaults={"resid" : None, "restype" : None})

# For a list of resources within session
#@mod.route('/<regex("[a-f0-9]{24}"):dbid>'
#                        '/sessions'
#                        '/<regex("[a-f0-9]{24}"):sessid>'
#                        '/<regex("(attachments|views)"):restype>', defaults={"resid" : None})

# For a particular resource within session
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

