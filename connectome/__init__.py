from flask import Flask, render_template, escape, g, request, redirect, url_for, flash, send_from_directory, Response, abort, current_app, make_response
from slideatlas.version import get_git_name
from slideatlas import slconn as conn, admindb, model
from werkzeug.routing import BaseConverter
import glviewer
from flask_bootstrap import Bootstrap
import mongokit

import sys, os

from bson import ObjectId
import json
from slideatlas.common_utils import jsonify

import base64

import pdb






# Create App
sys.path.append(os.path.dirname(__file__))
app = Flask(__name__)
#app.debug = True

app.config.from_object("site_local")

# Connection settings for local demo database for testing (VM)
slconn = mongokit.Connection(app.config["MONGO_SERVER"], tz_aware=False, auto_start_request=False)
admindb = slconn["admin"]

if  app.config["LOGIN_REQUIRED"]:
    admindb.authenticate(app.config["USERNAME"], app.config["PASSWORD"])

# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

app.config['BOOTSTRAP_USE_MINIFIED'] = False

class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


app.url_map.converters['regex'] = RegexConverter

Bootstrap(app)

import glviewer
app.register_blueprint(glviewer.mod)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.route('/home')
def home():
    """
    All routes get redirected here
    - / Says Hello <name>
    - /<name> Says Hello <name>

    """
    return render_template('home.html', git=get_git_name(), host=app.config["MONGO_SERVER"])





#==============================================================================


# I am getting rid of the special paths in favor of just using the type to select the viewer.
# this is legarcy code.
@app.route('/viewer')
def viewer():
    """
    - /viewer?db=507619bb0a3ee10434ae0827
    """

    #
    dbName = request.args.get('db', '')
    collectionName = request.args.get('col', '')

    return render_template('connectome.html', db=dbName, col=collectionName)



def encodeSection(sectionObj) :
    sectionObj["_id"] = str(sectionObj["_id"])
    if sectionObj.has_key("worldPointsFloat64") :
      sectionObj["worldPointsFloat64"] = base64.b64encode(str(sectionObj["worldPointsFloat64"]))
    for imageObj in sectionObj["images"] :
      if imageObj.has_key("meshPointsInt32") :
        imageObj["meshPointsInt32"] = base64.b64encode(str(imageObj["meshPointsInt32"]))
      if imageObj.has_key("meshPointIdsInt32") :
        imageObj["meshPointIdsInt32"] = base64.b64encode(str(imageObj["meshPointIdsInt32"]))
      if imageObj.has_key("meshTrianglesInt32") :
        imageObj["meshTrianglesInt32"] = base64.b64encode(str(imageObj["meshTrianglesInt32"]))

    return jsonify(sectionObj)    
    



# List of sections (with id, waferName and section)
@app.route('/getsections')
def getsections():
    #pdb.set_trace()
    dbName = request.args.get('db', '')
    collectionName = request.args.get('col', '')
    sectionId = request.args.get('id', None)
    objType = request.args.get('type', 'Section')
    # passed to server to be returned to client (hack)
    sectionIndex = request.args.get('idx', None)

    db = conn[dbName]
    
    if sectionId :
      sectionObj = db[collectionName].find_one({'_id':ObjectId(sectionId)})
      if sectionIndex :
        sectionObj["index"] = int(sectionIndex)
        r = encodeSection(sectionObj)
        return r
    else :
      sectionCursor = db[collectionName].find({"type":objType},{"waferName":1, "section":1}).sort([("waferName", 1), ("section", 1)])
      # make a new structure to return.  Convert the ids to strings.
      sectionArray = [];
      for section in sectionCursor:
        section["_id"] = str(section["_id"])
        sectionArray.append(section)
      data = {}
      data["sections"] = sectionArray
      return jsonify(data)


# Tile that uses database name.
@app.route('/tile')
def tile():
    #pdb.set_trace()

    # Get variables
    dbName = request.args.get('db', None)
    imgName = request.args.get('img', None)
    name = request.args.get('name', None)

    
    imgdb = conn[dbName]
    colImage = imgdb[imgName]
    docImage = colImage.find_one({'name':name})

    if docImage == None:
        abort(403)
    return Response(str(docImage['file']), mimetype="image/jpeg")

# Correlations for section.
@app.route('/getcorrelations')
def getcorrelations():
    #pdb.set_trace()
    dbName = request.args.get('db', '')
    collectionName = request.args.get('col', '')
    wafer = request.args.get('wafer', None)
    section = int(request.args.get('sect', 1))

    db = conn[dbName]
    
    data = {};
    data["CorrelationArray0"] = [];
    data["CorrelationArray1"] = [];
    sectionObj0 = db[collectionName].find_one({'montage0.waferName':wafer, 'montage0.sectionNumber':section})
    if sectionObj0 :
      if "correlations" in sectionObj0 :
        data["CorrelationArray0"] = sectionObj0["correlations"];
    
    sectionObj1 = db[collectionName].find_one({'montage1.waferName':wafer, 'montage1.sectionNumber':section})
    if sectionObj1 :
      if "correlations" in sectionObj1 :
        data["CorrelationArray1"] = sectionObj1["correlations"];
    
    return jsonify(data)

# Remove an object from the database collection.
@app.route('/removeobject')
def removeobject():
    #pdb.set_trace()
    dbName = request.args.get('db', '')
    collectionName = request.args.get('col', '')
    idStr = request.args.get('id', '')

    db = conn[dbName]
    
    db[collectionName].remove({'_id': ObjectId(idStr)})
    
    return


@app.route('/correlation')
def debugcorrelation():
    return render_template('correlation.html')

