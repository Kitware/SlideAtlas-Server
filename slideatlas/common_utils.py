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
import flask
from functools import wraps
import urllib2

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
def login_required(f):
    """Checks whether user is logged in or redirects to login with possible next url on success"""
    @wraps(f)
    def decorator(*args, **kwargs):
        if not 'user' in flask.session:
            flask.flash("Login required !", "error")
            return flask.redirect(flask.url_for("login.login") + "?next=" + urllib2.quote(flask.request.url))
        else:
            return f(*args, **kwargs)
    return decorator


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


## Generate a human readable 'random' password
## password  will be generated in the form 'word'+digits+'word'
## eg.,nice137pass
## parameters: number of 'characters' , number of 'digits'
## Pradeep Kishore Gowda <pradeep at btbytes.com >
## License : GPL
## Date : 2005.April.15
## Revision 1.2
## ChangeLog:
## 1.1 - fixed typos
## 1.2 - renamed functions _apart & _npart to a_part & n_part as zope does not allow functions to
## start with _

def nicepass(alpha=6,numeric=2):
    """
    returns a human-readble password (say rol86din instead of
    a difficult to remember K8Yn9muL )
    """
    import string
    import random
    vowels = ['a','e','i','o','u']
    consonants = [a for a in string.ascii_lowercase if a not in vowels]
    digits = string.digits

    ####utility functions
    def a_part(slen):
        ret = ''
        for i in range(slen):
            if i%2 ==0:
                randid = random.randint(0,20) #number of consonants
                ret += consonants[randid]
            else:
                randid = random.randint(0,4) #number of vowels
                ret += vowels[randid]
        return ret

    def n_part(slen):
        ret = ''
        for i in range(slen):
            randid = random.randint(0,9) #number of digits
            ret += digits[randid]
        return ret

    ####
    fpl = alpha/2
    if alpha % 2 :
        fpl = int(alpha/2) + 1
    lpl = alpha - fpl

    start = a_part(fpl)
    mid = n_part(numeric)
    end = a_part(lpl)

    return "%s%s%s" % (start,mid,end)