# This program
# When older uploader is used to upload images, it creates chapter and images in old style. This needs to be converted to session and sessions-list
# If the chapter (from chapters collection) is already present, it will remove that record

import pymongo
import sys
import os
from subprocess import call
import argparse
import datetime
import os

debug = False

def dump_meta_collections(args, db, root_path):
    """
    from supplied database object, dumps all the collections that do not start with a number (objectId)
    """
    newpath = root_path + "/" + datetime.datetime.now().strftime('metabackup_%d_%m_%Y')
    # Create a folder with current date and time
    if os.path.exists(newpath):
        print "[Error] Time folder exists"
        sys.exit(0)
    else:
        os.makedirs(newpath)
    cols = db.collection_names()
    num = len(cols)
    count = 0

    for acol in cols:
        backup = True

        # If the collection is image collection
        if acol[0] == '4' or acol[0] == '5':
            print "Skipping ", acol
        else:
            params = [ "mongodump", "-h", "slide-atlas.org", "-u", "claw", "-p", "claw123", "-d", "bev1", "-c", acol, "-o", newpath]
            call(params)

        count = count + 1
        print "Done .." + str(count) + "/" + str(num)

if __name__ == "__main__":
    #want command line argument
    parser = argparse.ArgumentParser(description='Utility to dumps all the collections that do not start with a number (objectId)')
    parser.add_argument('db' , help='Database instance from which to read')
    parser.add_argument('-r', '--root' , help='The root path of where to backup', default=".")

    parser.add_argument("-m", "--mongo" , help='MongoDB Server from which to read', default="slide-atlas.org")
    # In future accept license as the argument
    parser.add_argument('-u', '--admin-user', help='admin user (for MongoDB)', default='')
    parser.add_argument('-p', '--admin-password', help='admin user password (for MongoDB)', default='')

    parser.add_argument('-n', '--no-op', help='Dry run, no updates to the destination database (default:%(default)s)', default=False, action='store_true')
    parser.add_argument('-d', '--debug', help='Print more output useful for debugging (default:%(default)s)', default=False, action='store_true')
    parser.add_argument('-a', '--all', help='Process all databases (Not implemented now) (default:%(default)s)', default=False, action='store_true')

    args = parser.parse_args()

    if args.all == True:
        print "Parameter -a, --all is not supported yet"
        sys.exit(0)

    # connect with the database
    try:
        conn = pymongo.Connection(args.mongo)
        if len(args.admin_user) > 0:
            print "Authenticating .."
            admindb = conn["admin"]
            if not admindb.authenticate(args.admin_user, args.admin_password):
                raise True
            db = conn[args.db]
        print 'Connection OK'
    except:
        print 'Cound not Connect ..'
        sys.exit(0)

    dump_meta_collections(args, db, args.root)
