# useful find utility (please reuse if possible)

import pymongo
import sys
import bson.objectid as oid

def get_object_in_collection(col, key, debug=False, soft=False):

    # Find if the key is id
    obj = None
    try:
        obj = col.find_one({'_id' : oid.ObjectId(key)})
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

def get_session_from_key(db, key, debug=False):
    pass
