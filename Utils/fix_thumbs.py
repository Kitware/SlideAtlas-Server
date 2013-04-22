from __future__ import absolute_import
import pymongo
from bson import ObjectId
import argparse
import sys
import os

sys.path.append(os.path.abspath(".."))
from common_utils import get_object_in_collection

# def CreateJpegThumb(binary_jpeg_image, channel_threshold=245):
# TODO: Currently depends on wx, this routine should be rewritten 
from create_thumb import CreateJpegThumb

# Accept DB and SESSION and recreate thumbs if t.jpg exists
if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Utility to regenerate thumb nails')
    parser.add_argument('db' , help='Database instance from which to read')
    parser.add_argument('session' , help='Session ID or name to synchronize')
    parser.add_argument("-m", "--mongo" , help='MongoDB Server from which to read', default="slide-atlas.org")
    parser.add_argument('-n', '--no-op', help='Dry run, no updates to the destination database', action='store_true')
    parser.add_argument('-f', '--force', help='Entirely removes the session and re-creates', action='store_true')
    parser.add_argument('-d', '--debug', help='Print more output useful for debugging (default:%(default)s)', default=False, action='store_true')
    parser.set_defaults(debug=False)

    args = parser.parse_args()

    # TODO: Currently hardcodes the authentication, should use parameters from slideatlas
    try:
        # Try opening the database
        conn = pymongo.Connection(args.mongo)
        admindb = conn["admin"]
        if admindb.authenticate("slideatlasweb", "2&PwRaam4Kw") == 0:
            print "Auth error"
            raise 1

        db = conn[args.db]

    except:
        print "Error opening ", args.db
        sys.exit(0)

    # List all the images in the session
    colviews = db["views"]
    colsessions = db["sessions"]

    sessionobj = get_object_in_collection(colsessions, args.session)

    if sessionobj == None:
        print "Error opening ", args.session
        sys.exit(0)

#    print "Found session:", sessionobj["label"], "Contains: ", sessionobj.keys()

    for aview in sessionobj["views"]:
        viewobj = get_object_in_collection(colviews, aview["ref"])
        img_name = viewobj["img"]
        print "Working with: ", img_name,

        colimage = db[str(img_name)]
        tjpeg = get_object_in_collection(colimage, "t.jpg")
#        print tjpeg["name"]

        thumb = CreateJpegThumb(tjpeg["file"])

        thumbobj = get_object_in_collection(colimage, "thumb.jpg")
        if thumbobj == None:
            print "Creating Thumb"
            colimage.insert({"name" : "thumb.jpg", 'file' : thumb})
        else:
            print "Updating Thumb"
            colimage.update({"_id" : thumbobj["_id"]}, {"$set" : { 'file' : thumb}})

