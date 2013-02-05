from flask import Blueprint, render_template, request, url_for, current_app
from bson import ObjectId
from slideatlas import slconn as conn
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
    viewid = request.args.get('view', None)
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db', None)

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    #dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(sessdb) })
    db = conn[dbobj["dbname"]]
    
    viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
    imgid = viewobj["img"]    
    
    if not imgid:
        imgid = '4f2808554834a30ccc000001'

    # TODO: Store database in the view and do not pass as arg.
    if not dbid:
        dbid = '5074589002e31023d4292d83'

    conn.register([model.Database])

    # difference? #dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    #dbobj = admindb["databases"].find_one({"_id" : ObjectId(dbid)})
    imgdb = conn[dbobj['dbname']]

    colImage = imgdb["images"]
    docImage = colImage.find_one({'_id':ObjectId(imgid)})

    # Get the startup camera (bookmark)
    bookmarkid = viewobj["startup_view"]
    colBookmark = imgdb["bookmarks"]
    docBookmark = colBookmark.find_one({'_id':ObjectId(bookmarkid)})
    
    img = {}
    img["collection"] = str(docImage["_id"])
    img["origin"] = str(docImage["origin"])
    img["spacing"] = str(docImage["spacing"])
    img["levels"] = str(docImage["levels"])
    img["dimension"] = str(docImage["dimension"])
    img["db"] = dbid
    img["center"] = str(docBookmark["center"])
    img["zoom"] = str(docBookmark["zoom"])
    img["rotation"] = str(docBookmark["rotation"])

    return render_template('viewer.html', img=img)
