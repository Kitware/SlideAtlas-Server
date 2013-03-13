#!/usr/bin/python  
# Command line tool and function code for managing image items 
# (please reuse if possible)
# adds or delets images from sessions 
# The image must already exist

import pymongo
import sys
import bson.objectid as oid
import argparse

import string
import random
import datetime
import cPickle as pickle
import base64

def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for x in range(size))

def create_user(admindb, userdb, key=None, debug=False):
    """
    Assumes that the db is authenticated connection to the database
    Creates a random username password pair and creates such a user to that database
    creates a relevant filename and encrypts the 
    """
	# Find if the key is id
    uname = id_generator(3)
    pwd = id_generator(6)

#    uname = "AAB"
#    password = "1234"

    print "Username: ", uname
    print "Password: ", pwd

    # TODO the record later
    print userdb
    conn = userdb.connection
    # Find  if the database exists
    dbrec = admindb["databases"].find_one({'dbname' :  userdb.name, 'host' : conn.host})

    info = {  "host" : conn.host,
                   "db" : userdb.name,
                   "username":  uname,
                   "password": pwd,
                   "created_at": datetime.datetime.utcnow(),
                   'version': 11,
                   'created_by' : oid.ObjectId("507db8bf8af4a5e2a18d7081")
                 }

    if dbrec <> None:
        print "Database record found in the admin database"
        admindb["databases"].update({"_id" : dbrec["_id"]}, { "$push" :  { "users" :  info }})
    else:
        print "Database not registered"

    # Create the user
    userdb.add_user(uname, pwd, False)

    return info


def error_exit(msg):
		print "ERROR: ", msg
		print "Aborting  .."
		sys.exit(0)

# Main to accept command line and do the operation on images. 
if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Utility to rename sessions on 1.x slideatlas servers')
    parser.add_argument('-d', '--db' , required=True, help='Database to which user is added')
    parser.add_argument('-u', '--username' , default="", help='Admin Username (Should have write access)')
    parser.add_argument('-p', '--password' , default="", help='Admi Password')
    parser.add_argument('-m', '--mongodb' , help='MongoDB Server to connect to', default="127.0.0.1:27017")
    parser.add_argument('-a', '--admindb' , help='Administrative database')
    parser.add_argument('-k', '--key' , help='File key to user')

    parser.add_argument('-n', '--noop', help='Dry run, no updates to the destination database', action='store_true')
    parser.add_argument('-v', '--verbose', help='Print more output useful for debugging (default:%(default)s)', default=False, action='store_true')

    parser.set_defaults(debug=False)

    args = parser.parse_args()

    if args.verbose:
        print "Parsed Arguments - "
        val = ''
        for key in args.__dict__:
            print "    ", key, ": ", args.__dict__[key]
        print

    # Try authenticated connection 
    try:
        conn = pymongo.Connection(args.mongodb)
        mongodb = conn["admin"]
        # Find if authentication is necessary
        if len(args.username) > 0:
            if not mongodb.authenticate(args.username, args.password):
                raise 1
            else:
                print "Connection Successful .. "
        else:
                print "Connection with no authentication ... "
    except:
    	error_exit("Error opening " + args.db + " at " + args.mongodb)

    admindb = conn[args.admindb]
    db = conn[args.db]
    data = create_user(admindb, db, "some")

    # Encrypt the key, emit the license
    license = base64.b64encode(pickle.dumps(data))

    # Create a file
    file = open(data["host"] + "_" + data["db"] + ".lic", "wb")
    print license
    file.write(license)
    print pickle.loads(base64.b64decode(license))

    print   "Done"
