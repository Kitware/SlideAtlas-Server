from flask import Blueprint, Response, abort, request, session
from slideatlas.connections import slconn as conn
from bson import ObjectId
from slideatlas import model

mod = Blueprint('tile', __name__)

@mod.route('/tile')
def tile():
    """
    - /tile/4e695114587718175c000006/t.jpg  searches and returns the image
    """
    # Get variables
    img = request.args.get('img', None)
    db = request.args.get('db', None)
    name = request.args.get('name', None)

    if not 'user' in session:
        abort(403)

    conn.register([model.Database])
    admindb = conn["slideatlasv2"]
    dbobj = admindb["databases"].find_one({"_id" : ObjectId(db)})
    imgdb = conn[dbobj['dbname']]
    colImage = imgdb[img]
    docImage = colImage.find_one({'name':name})

    if docImage == None:
        abort(403)
    return Response(str(docImage['file']), mimetype="image/jpeg")

