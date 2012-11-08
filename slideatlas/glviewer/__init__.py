from flask import Blueprint, render_template, request, url_for
from bson import ObjectId
from slideatlas.connections import slconn as conn
from slideatlas import model

mod = Blueprint('glviewer', __name__,
                template_folder="templates",
                static_folder="static",
                url_prefix="/webgl-viewer"
                )

@mod.route('')
def glview():
    """
    - /glview?imgid=10239094124  searches for the session id
    """

    # See if the user is requesting any session id
    imgid = request.args.get('img', None)
    db = request.args.get('db', None)

    if not imgid:
        imgid = '4f2808554834a30ccc000001'

    if not db:
        db = '5074589002e31023d4292d83'

    conn.register([model.Database])
    admindb = conn["slideatlasv2"]
    dbobj = admindb["databases"].find_one({"_id" : ObjectId(db)})
    print dbobj
    imgdb = conn[dbobj['dbname']]

    colImage = imgdb["images"]
    docImage = colImage.find_one({'_id':ObjectId(imgid)})

    img = {}
    img["collection"] = str(docImage["_id"])
    img["origin"] = str(docImage["origin"])
    img["spacing"] = str(docImage["spacing"])

    return render_template('viewer.html', img=img, db=db)
