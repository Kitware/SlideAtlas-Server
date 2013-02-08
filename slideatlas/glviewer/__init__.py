from flask import Blueprint, render_template, request, url_for, current_app, make_response

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
    - /glview?view=10239094124&db=507619bb0a3ee10434ae0827
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

    
@mod.route('/dual')
def glviewdual():
    """
    - /webgl-viewer/dual?db=507619bb0a3ee10434ae0827&sessid=4ecbbc6d0e6f7d7a56000000
    """

    # See if the user is requesting any session id
    sessid = request.args.get('sessid', None)
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db', None)

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    
    coll = db["sessions"]
    asession = coll.find_one({'_id' : ObjectId(sessid)} )
    
    # if asession.has_key("views"):
    #        for aview in asession['views']:
    aview = asession['views'][0]
    viewobj = db["views"].find_one({"_id" : aview["ref"]})
    imgobj = db["images"].find_one({'_id' : ObjectId(viewobj["img"])})
    bookmarkobj = db["bookmarks"].find_one({'_id':ObjectId(viewobj["startup_view"])})
    

    # use the first view for the left panel.
    img = {}
    img["db"] = dbid
    img["collection"] = str(imgobj["_id"])
    img["origin"] = str(imgobj["origin"])
    img["spacing"] = str(imgobj["spacing"])
    img["levels"] = str(imgobj["levels"])
    img["dimension"] = str(imgobj["dimension"])
    img["center"] = str(bookmarkobj["center"])
    img["zoom"] = str(bookmarkobj["zoom"])
    img["rotation"] = str(bookmarkobj["rotation"])

    question = {}
    question["viewer1"] = img;
    # now create a list of options.
    options = []
    
    # iterate through the session objects
    asession = db["sessions"].find_one({'_id' : ObjectId(sessid)});
    for aview in asession['views']:
        viewobj = db["views"].find_one({"_id" : aview["ref"]})
        imgobj = db["images"].find_one({'_id' : ObjectId(viewobj["img"])})
        bookmarkobj = db["bookmarks"].find_one({'_id':ObjectId(viewobj["startup_view"])})
        #
        img = {}
        img["collection"] = str(imgobj["_id"])
        img["origin"] = str(imgobj["origin"])
        img["spacing"] = str(imgobj["spacing"])
        img["levels"] = str(imgobj["levels"])
        img["dimension"] = str(imgobj["dimension"])
        img["db"] = dbid
        img["center"] = str(bookmarkobj["center"])
        img["zoom"] = str(bookmarkobj["zoom"])
        img["rotation"] = str(bookmarkobj["rotation"])
        img["label"] = imgobj["label"]
        #
        options.append(img)
    question["options"] = options;       
    
    return make_response(render_template('dualviewer.html', question=question))

    
    
    