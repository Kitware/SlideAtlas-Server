from __future__ import absolute_import
import pymongo
from bson import ObjectId
import argparse
import sys
import os


MONGO_SERVER = "slide-atlas.org:27017"
MONGO_DB = "bev1"

# connect locally
conn = pymongo.Connection(MONGO_SERVER)
admindb = conn["admin"]
admindb.authenticate("slideatlasweb", "2&PwRaam4Kw")

db = conn[MONGO_DB]
views = db["views"]
count = 1
for aview in db["views"].find():
    if not "img" in aview:
        print "#%d, there goes the suspect"%(count)
        img = aview["ViewerRecords"][0]["Image"]
        label = aview["Title"]
        print "   Image: ", img
        print "   Label: ",
        count = count + 1
