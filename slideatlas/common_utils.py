try:
    import simplejson as json
except ImportError:
    try:
        import json
    except ImportError:
        raise ImportError
import datetime
from bson.objectid import ObjectId
from flask import Response, session, abort, flash, redirect

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
def site_admin_required(page=False):
    """Checks whether an site administrator user is logged in or raises error 401."""
    def real_decorator(function):
        def decorator(*args, **kwargs):
            if not ('site_admin' in session and session['site_admin'] == True):
                if page:
                    flash("You do not have administrative previleges", "error")
                    return redirect("/home")
                else:
                    abort(401)
            else:
                return function(*args, **kwargs)
        return decorator
    return real_decorator


def get_object_in_collection(col, key, debug=False, soft=False):
    """
    Gets a record based on key or name from the given pymongo collection
    """
    # Find if the key is id
    obj = None
    try:
        obj = col.find_one({'_id' : ObjectId(key)})
        if obj <> None:
            return obj
    except:
        if debug:
            print "_ID did not work",

    # else check in the 
    obj = col.find_one({'name':key})

    if obj <> None:
        if debug:
            print 'Name works',
        return obj

    if soft == True:
        # dig through the images in the session
        print "Being softer"

        found = 0

        # Get a list of all image names and 
        for animage in col.find():
            if key in animage['name']:
                print '   Matched :', animage['name']
                found = found + 1
                obj = animage

        if found == 1:
            if debug:
                print 'Soft matching worked ..'
            return obj

        elif found > 1:
            print 'Cannot work with multiple matches ..'

    if debug:
        print "Nothing worked .."
    return None


