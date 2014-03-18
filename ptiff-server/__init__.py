__author__ = 'dhanannjay.deo'

import flask
from flask import request
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

@app.route("/tile")
def tile():
    # Get variables
    x = int(request.args.get('x', 0))
    y = int(request.args.get('y', 0))
    z = int(request.args.get('z', 0))

    # Locate the tilename from x and y
    locx = x * 512
    locx = x * 512


    docImage = colImage.find_one({'name': "t.jpg"})

    if docImage == None:
        flask.abort(403)
    return flask.Response(str(docImage['file']), mimetype="image/jpeg")



if __name__ == '__main__':
    app.run()