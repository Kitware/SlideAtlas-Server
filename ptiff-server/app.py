__author__ = 'dhanannjay.deo'


import flask
from flask import request
import sys
import os

# tplpath = os.path.abspath(os.path.join(os.path.dirname(__file__),"..", "tpl"))
# pylibtiffpath = os.path.join(tplpath, "pylibtiff-read-only", "build", "lib.linux-x86_64-2.7")
# print pylibtiffpath
# print tplpath
#
# sys.path = [pylibtiffpath] + sys.path

import os
tilereaderpath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../experiments"))
print tilereaderpath
import logging
logging.getLogger().setLevel(logging.INFO)
logging.basicConfig()
sys.path.append(tilereaderpath)
app = flask.Flask(__name__)

@app.route('/')
def viewer():

    return "Helllo"
    # flask.send_from_directory("static","index.html")

##############################3
# for loading tiles

import pymongo

app.config.from_object("config")
# Connection settings for local demo database for testing (VM)
conn = pymongo.MongoClient(app.config["MONGO_SERVER"], tz_aware=False, auto_start_request=False)
admindb = conn["admin"]
imgdb = conn["demo"]
colImage = imgdb["531656dea86480a4e608caf9"]

if app.config["LOGIN_REQUIRED"]:
    admindb.authenticate(app.config["USERNAME"], app.config["PASSWORD"])

from common_utils import get_tile_name_slideatlas
import logging
blank = open("blank_512.jpg","rb").read()

@app.route("/tile_mongo")
def tile_mongo():
    # Get variables
    x = int(request.args.get('x', 0))
    y = int(request.args.get('y', 0))
    z = int(request.args.get('z', 0))

    # Locate the tilename from x and y
    locx = x * 512
    locx = x * 512

    docImage = colImage.find_one({'name': get_tile_name_slideatlas(x,y,z)})
    logging.log(logging.ERROR,get_tile_name_slideatlas(x,y,z))
    if docImage == None:
        return flask.Response(blank, mimetype="image/jpeg")
    return flask.Response(str(docImage['file']), mimetype="image/jpeg")


os.environ['PATH'] = os.path.dirname(__file__) + ';' + os.environ['PATH']
# os.chdir('D:\\projects\\tiff-4.0.3\\libtiff')
from extract_tile import TileReader

# myfname = "d:\\data\\phillips\\20140313T180859-805105.ptif"
myfname = "/home/dhan/data/phillips/20140313T180859-805105.ptif"

reader = TileReader()
reader.set_input_params({"fname" : myfname})
import StringIO
# #
# from extract_tile import list_tiles
# list_tiles(0, fname=myfname)


@app.route("/tile_ptiff")
def tile_ptiff():
    # Get variables
    x = int(request.args.get('x', 0))
    y = int(request.args.get('y', 0))
    z = int(request.args.get('z', 0))
        # Locate the tilename from x and y
    locx = x * 512 + 5
    locy = y * 512 + 5

    if reader.dir != z:
        reader.select_dir(z)
        logging.log(logging.ERROR, "Switched to %d zoom"%(reader.dir))

    fp = StringIO.StringIO()
    r = reader.dump_tile(locx,locy, fp)

    try:
        r = reader.dump_tile(locx,locy, fp)
        if r > 0:
            logging.log(logging.ERROR, "Read %d bytes"%(r))
        else:
            raise Exception("Tile not read")

    except Exception as e:
        #docIma ge = colImage.find_one({'name': get_tile_name_slideatlas(x,y,z)})
        logging.log(logging.ERROR, "Tile not loaded: %s"%(e.message))
        fp.close()
        return flask.Response(blank, mimetype="image/jpeg")

    #s = fp.getvalue()
    #logging.log(logging.ERROR, "Got %d bytes in buffer"%(len(s)))
    # fp2 = open("test_output.jpg","wb")
    # fp2.write(fp.getvalue())
    # fp2.close()
    return flask.Response(fp.getvalue(), mimetype="image/jpeg")
