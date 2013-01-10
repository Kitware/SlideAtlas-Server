#!/usr/bin/python  
# Command line tool and function code for managing image items 
# (please reuse if possible)
# adds or delets images from sessions 
# The image must already exist

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



import argparse

def error_exit(msg):
		print "ERROR: ", msg
		print "Aborting  .."
		sys.exit(0)

# Main to accept command line and do the operation on images. 
if __name__ == '__main__':

	parser = argparse.ArgumentParser(description='Utility to delete images on 1.x slideatlas servers')

	parser.add_argument('-d', '--db' , required=True, help='Database instance from which to read')
	parser.add_argument('-m', '--mongodb' , help='MongoDB Server from which to read', default="127.0.0.1:27017")
	parser.add_argument('-s', '--session' , help='Session ID or name to synchronize, if not specified deletes from all sessions', default='all')

	parser.add_argument('-i', '--image' , help='Image ID or name to manipulate. use -o for soft name comparisons', required=True)

	parser.add_argument('-n', '--noop', help='Dry run, no updates to the destination database', action='store_true')

	parser.add_argument('-v', '--verbose', help='Print more output useful for debugging (default:%(default)s)', default=False, action='store_true')
	parser.add_argument('-o', '--soft', help='Allows soft comparison between image_key and image_label (default:%(default)s)', default=False, action='store_true')

	parser.set_defaults(debug=False)

	args = parser.parse_args()

	try:
		# Try opening the database	
		conn = pymongo.Connection(args.mongodb)
		admindb = conn["admin"]
		admindb.authenticate("slideatlasweb", "2&PwRaam4Kw")
		mongodb = conn[args.db]

	except:
		error_exit("Error opening " + args.db + " at " + args.mongodb)

	if args.verbose:
		print "Parsed Arguments - "
		val = ''
		for key in args.__dict__:
			print "    ", key, ": ", args.__dict__[key]


		if args.soft:
			print "     Soft comparisons"

	# If Session is all, then look through all the sessions to find where the image is 
	image = get_object_in_collection(mongodb['images'], args.image, soft=args.soft)

	if image == None:
		error_exit("Image not found: " + args.image)

	print "\nImage found: ", image['_id']
	print image

	#print "  Name: ", image['name']

	sessions = []

	if args.session == 'all':
		print "Only session specific image removal supported"
		sys.exit(0)
		# TODO: First find all views 
		views = []

		for asession in mongodb['sessions'].find():
			print asession.keys()
			# TODO: Look in views not in sessions 
			for aref in asession['views']:
				if aref['ref'] == image['_id']:
					print "  Listed in session:  ", asession['name']
					sessions.append(asession)
	else:
		asession = get_object_in_collection(mongodb['sessions'], args.session, soft=args.soft)
		if asession <> None:
			print "  Listed in session:  ", asession['label']
			sessions.append(asession)
		else:
			error_exit("Session not found: " + args.session)

	print "\nImage found in %d sessions" % (len(sessions))

	if not args.noop :
		print "Do you still want to delete (y/n) ?",
		resp = raw_input()
		if resp == 'y' or resp == 'Y':
			for asession in sessions:
				print "Deleting from : ", asession['_id']
				# TODO: delete the corresponding view
				views = asession['views']
				found = False
				for aview in views:
					viewobj = get_object_in_collection(mongodb["views"], aview["ref"])
					if viewobj['img'] == image['_id']:
						# Remove this reference and this image
						found = True
						index = views.index(aview)
						col_to_del = str(views[index]['ref'])
						print "Image ", col_to_del, " set for deletion"
						# TODO: Delete actual image 
						del views[index]
						# Delete the image collection
						mongodb.drop_collection(col_to_del)
						# Remove the viewobj from views collection

				# Done processing image list in a session  
				if found:
					mongodb['sessions'].update({'_id': asession['_id']}, {'$set':{'views': views}})
				else:
					error_exit("Unexpected behavior")

			# Done with removing image reference from multiple sessions
			mongodb['images'].remove({'_id': image['_id']})
		else:
			print "\nOperation aborted .."
	else:
		print "\nNo operations.."

	print "Done"
