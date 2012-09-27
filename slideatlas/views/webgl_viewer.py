from flask import Blueprint, render_template, session, redirect, url_for, request
from pymongo import Connection
from bson import ObjectId
mod = Blueprint('webgl-viewer', __name__)


@mod.route('/glview')
def glview():
    """    
    - /glview?imgid=10239094124  searches for the session id 
    """

    # See if the user is requesting any session id
    imgid = request.args.get('imgid', None)
    if not imgid:
        imgid = '4e695114587718175c000006'

    # Connect with 
    conn = Connection("ayodhya:27017", tz_aware=False)

    colImage = conn["demo"]["images"]
    docImage = colImage.find_one({'_id':ObjectId(imgid)})

    img = {}
    img["collection"] = str(docImage["_id"])
    img["origin"] = str(docImage["origin"])
    img["spacing"] = str(docImage["spacing"])

    return render_template('webgl-viewer/viewer.html', img=img)
