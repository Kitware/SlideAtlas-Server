# This program 
# When older uploader is used to upload images, it creates chapter and images in old style. This needs to be converted to session and sessions-list
# If the chapter (from chapters collection) is already present, it will remove that record 

import pymongo
import sys
import os
from subprocess import call
import argparse

debug = False

def dump_meta_collections(db, root_path):
	"""
	from supplied database object, dumps all the collections that do not start with a number (objectId)
	"""
	cols = db.collection_names()
	cols.reverse()
	num = len(cols)
	print num
	count = 0

	for acol in cols:
		backup = True
		print acol,

		# If the collection is image collection
		if acol[0] == '4' or acol[0] == '5':
			if os.path.exists(acol + ".bson"):
				print "Already exists"
				backup = False
			else:
				if not only_meta:
					backup = True
				else:
					backup = False

		if backup:
			print " ",
			call(["mongodump", "--host", mongo, "-d", database, "-c", acol, "-o", ".."])
		count = count + 1
		print "Done .." + str(count) + "/" + str(num)

if __name__ == "__main__":
	#want command line argument
	parser = argparse.ArgumentParser(description='Utility to dumps all the collections that do not start with a number (objectId)')
	parser.add_argument('db' , help='Database instance from which to read')
	parser.add_argument("-m", "--mongo" , help='MongoDB Server from which to read', default="slide-atlas.org")
	# In future accept license as the argument
	parser.add_argument('-u', '--admin-user', help='admin user (for MongoDB)', default='')
	parser.add_argument('-p', '--admin-password', help='admin user password (for MongoDB)', default='')

	parser.add_argument('-n', '--no-op', help='Dry run, no updates to the destination database (default:%(default)s)', default=False, action='store_true')
	parser.add_argument('-d', '--debug', help='Print more output useful for debugging (default:%(default)s)', default=False, action='store_true')
	parser.add_argument('-a', '--all', help='Process all databases (Not implemented now) (default:%(default)s)', default=False, action='store_true')


	args = parser.parse_args()

	print args

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
