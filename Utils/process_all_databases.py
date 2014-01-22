"""
Convenience utility to process all databases in slide-atlas
"""

import pymongo
import sys
import os
from subprocess import call
import argparse
import datetime
import os
import logging

debug = False

def process_db(args, db):
    """
    a database object is supplied for processing ,
    """
    logging.info("Processing: " +  str(db))

if __name__ == "__main__":
    #want command line argument
    parser = argparse.ArgumentParser(description='Utility to process all databases in slide-atlas')

    parser.add_argument('-a', "--admin-db", help='Database instance from which to read admin information (default:%(default)s)', default="slideatlasv2")

    parser.add_argument("-m", "--mongo" , help='MongoDB Server from which to read (default:%(default)s)', default="slide-atlas.org")

    parser.add_argument('-u', '--admin-user', help='admin user (for MongoDB)')
    parser.add_argument('-p', '--admin-password', help='admin user password (for MongoDB)')

    parser.add_argument('-n', '--no-op', help='Dry run, no updates to the destination database (default:%(default)s)', default=False, action='store_true')
    parser.add_argument('-d', '--debug', help='Print more output useful for debugging (default:%(default)s)', default=False, action='store_true')

    args = parser.parse_args()

    if args.debug:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    logging.debug(str(args))


    # connect with the database
    try:
        conn = pymongo.Connection(args.mongo)
        if len(args.admin_user) > 0:
            logging.debug("Authenticating ..")
            admindb = conn["admin"]
            if not admindb.authenticate(args.admin_user, args.admin_password):
                raise True
            db = conn[args.admin_db]
        logging.debug('Connection okay')
    except:
        logging.error('Cound not Connect ..')
        sys.exit(0)

    for adb in db["databases"].find():
        dbname = adb["dbname"]
        logging.debug("To process: " + dbname )
        process_db(args, conn[dbname])

    logging.debug("Done")
    sys.exit(0)
