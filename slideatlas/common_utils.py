try:
    import simplejson as json
except ImportError:
    try:
        import json
    except ImportError:
        raise ImportError
import datetime
from bson.objectid import ObjectId
from flask import Response, session, abort

class MongoJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        elif isinstance(obj, ObjectId):
            return unicode(obj)
        return json.JSONEncoder.default(self, obj)

def jsonify(*args, **kwargs):
    """ jsonify with support for MongoDB ObjectId
    """
    return Response(json.dumps(dict(*args, **kwargs), cls=MongoJsonEncoder), mimetype='application/json')


# Decorator for urls that require login
def user_required(f):
    """Checks whether user is logged in or raises error 401."""
    def decorator(*args, **kwargs):
        if not 'user' in session:
            abort(401)
        return f(*args, **kwargs)
    return decorator

class DBAccess(object):
    def __init__(self):
        self.db_admin = False
        self.can_see_all = False
        self.can_see = []
        self.can_admin = []

    def __str__(self):
        return str(self.__dict__)


# Decorator for urls that require login
def site_admin_required(f):
    """Checks whether an site administrator user is logged in or raises error 401."""
    def decorator(*args, **kwargs):
        if not ('site_admin' in session and session['site_admin'] == True):
            abort(401)
        return f(*args, **kwargs)
    return decorator

