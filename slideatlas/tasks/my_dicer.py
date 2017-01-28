
import os
import sys
import shutil

import logging

from bson import Binary
from bson import ObjectId
from bson.objectid import InvalidId

import pymongo

from pymongo import MongoClient
import gridfs


#import json
import pdb

import cv2
import math



# not efficient, but who cares.
def generate_tile_name(level, ix, iy):

    if level <= 1:
        return "t"

    #get the name from the previous level.
    px = math.floor(ix/2)
    py = math.floor(iy/2)
    base = generate_tile_name(level-1,px,py)
    ix = ix - 2*px
    iy = iy - 2*py

    if ix == 0 and iy == 0:
        return base+"q"
    elif ix == 1 and iy == 0:
        return base+"r"
    elif ix == 1 and iy == 1:
        return base+"s"
    #elif ix == 0 and iy == 1:
    return base+"t"



# todo: get the image from system rather than using a file name.


def my_process_file(args):
    client = MongoClient('localhost', 27017)
    db = client['olcd-slideatlas']
    img_db = client['olcd-imagestore']

    dry_run = False

    file_is_from_gridfs = False
    # Try if the input file is a file
    if not os.path.isfile(args["input"]):
        file_id = ObjectId(args["input"])

        # Locate the session
        session = db["sessions"].find_one({"_id":ObjectId(args["session"])})
        # we could get the database from the imagefile list,
        # but I think it is always the same.
        imagefile = img_db["imagefiles.files"].find_one({"_id":file_id})

        fs = gridfs.GridFS(img_db, "imagefiles")
        #afile = fs.find({"_id":file_id}) # returns a cursor, not a file
        afile = fs.get(file_id)

        # Create a temporary location
        temp_folder_name = str(ObjectId())
        newpath = os.path.join(".", temp_folder_name)
        os.makedirs(newpath)

        # Get the file from gridfs
        newinput = os.path.join(newpath, imagefile["filename"])
        ofile = open(newinput, "wb")
        ofile.write(afile.read())
        ofile.close()
        file_is_from_gridfs = True

        args["input"] = newinput

    sat_image = cv2.imread(args['input'])

    (y_dim, x_dim, num_comps) = sat_image.shape

    # compute the number of levels.
    padded_size = 256

    levels = 1
    while padded_size < x_dim or padded_size < y_dim:
        padded_size *= 2
        levels += 1
    padded_image = cv2.copyMakeBorder( \
        sat_image, 0, padded_size-y_dim, 0, padded_size-x_dim, \
        cv2.BORDER_CONSTANT, value=(255, 255, 255))

    # save the image meta data item
    file_name = os.path.basename(args["input"])
    image_obj = {"origin" : [0,0,0], "metadataready" : True, \
                 "dimensions" : [x_dim, y_dim], "TileSize" : 256, \
                 "spacing" : [1,1,1],"bounds" : [0,x_dim,0,y_dim], \
                 "label" : file_name, \
                 "levels" : levels, \
                 "components" : 3, \
                 "filename" : file_name}
    if not dry_run:
        image_id = img_db['images'].save(image_obj)
    else:
        image_id = "dry run"

    tile_collection_name = str(image_id)
    
    print("*=================================*")
    print("created image " + tile_collection_name)

    print("   num levels %d" % levels)
    # save the level tiles starting with the leaves (highest resolution)
    for rlevel in range(levels):
        level = levels - rlevel
        gx = int(math.ceil(x_dim / 256.0))
        gy = int(math.ceil(y_dim / 256.0))
        for iy in range(gy):
            for ix in range(gx):
                tile = padded_image[iy*256:(iy+1)*256, ix*256:(ix+1)*256]
                # compute the tile name
                name = "%s.jpg" % generate_tile_name(level,ix,iy)
                # save tile to a file.
                r, buf = cv2.imencode(".jpg",tile)
                tile_obj = {'name':name, 'level':level, 'file':Binary(buf.tostring())}
                if not dry_run:
                    img_db[tile_collection_name].save(tile_obj)
        # subsample the image for the next level.
        padded_image = cv2.resize(padded_image, (0,0), fx=0.5, fy=0.5)
        x_dim = x_dim / 2
        y_dim = y_dim / 2

    # now create the view that references this image
    (y_dim, x_dim, num_comps) = sat_image.shape
    view_obj = { "Title":file_name, "Text":"", "HiddenTitle":"", \
                 "CoordinateSystem":"Pixel", "SessionId":args['session'], \
                 "User":"law", "Date": 0, "Type":"Note", "Children" : [ ],
                 "user" : "law", 'ViewerRecords':[]}
    vr = {"NumberOfLevels" : levels, "Image" : image_id, \
          # hard coded for olcd.
          "Database" : ObjectId("55806c42395796bf3e96c536"), \
          "AnnotationVisibility" : 2, \
          "Camera" : {"Width" : x_dim, "Height" : y_dim, \
                      "FocalPoint" : [x_dim/2, y_dim/2], "Roll" : 0}}

    view_obj["ViewerRecords"] = [vr];
    if not dry_run:
        view_id = db["views"].save(view_obj)
        print("=================================")
        print("created view " + str(view_id))
    else:
        view_id = "dry_run"

    # Now add it to the session.
    sess_obj = db["sessions"].find_one({'_id':ObjectId(args["session"])})
    sess_obj['views'].append(view_id)
    if not dry_run:
        db["sessions"].save(sess_obj)

    # TODO: Remove the file from gridfs or make it invisible in the queue
    if file_is_from_gridfs:
        # clean up the temporary file
        shutil.rmtree(newpath)





# usage python upload_large_image in_file_name session_id
if __name__ == '__main__':


    args = {'session': sys.argv[1], \
            'input': sys.argv[2]} 


    my_process_file(args)

