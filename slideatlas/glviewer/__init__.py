import mongokit
import json
from bson import ObjectId
from flask import Blueprint, Response, abort, jsonify, request, render_template, url_for, current_app, make_response
from slideatlas import slconn as conn, admindb, model






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
    img["viewid"] = str(viewid)
    img["dbid"] = str(dbid)
    img["collection"] = str(docImage["_id"])
    img["origin"] = str(docImage["origin"])
    img["spacing"] = str(docImage["spacing"])
    img["levels"] = str(docImage["levels"])
    img["dimension"] = str(docImage["dimension"])
    img["db"] = dbid
    img["center"] = str(docBookmark["center"])
    img["rotation"] = str(docBookmark["rotation"])
    if 'zoom' in docBookmark:
        img["zoom"] = str(docBookmark["zoom"])
    if 'viewHeight' in docBookmark:
        img["viewHeight"] = str(docBookmark["viewHeight"])

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



@mod.route('/comparison')
def glcomparison():
    """
    - /webgl-viewer/comparison?db=507619bb0a3ee10434ae0827&viewid=5074528302e3100db8429cb4
    """

    # Comparison is a modified view.
    viewid = request.args.get('view', None)
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db', None)

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    

    viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
    imgobj = db["images"].find_one({'_id' : ObjectId(viewobj["img"])})
    bookmarkobj = db["bookmarks"].find_one({'_id':ObjectId(viewobj["startup_view"])})
    

    # The base view is for the left panel
    img = {}
    img["db"] = dbid
    img["viewid"] = viewid
    img["collection"] = str(imgobj["_id"])
    img["origin"] = str(imgobj["origin"])
    img["spacing"] = str(imgobj["spacing"])
    img["levels"] = str(imgobj["levels"])
    img["dimension"] = str(imgobj["dimension"])
    img["center"] = str(bookmarkobj["center"])
    img["rotation"] = str(bookmarkobj["rotation"])
    if 'zoom' in bookmarkobj:
        img["viewHeight"] = 900 << int(bookmarkobj["zoom"])
    if 'viewHeight' in bookmarkobj:
        img["viewHeight"] = str(bookmarkobj["viewHeight"])

    question = {}
    question["viewer1"] = img;
    
    # now create a list of options.
    # this array will get saved back into the view
    optionViews = []
    # I am separating out the image information because we get it from the images
    optionImages = []
    
    # I am embedding views in the options array rather than referencing object ids.
    if 'options' in viewobj:
        for viewobj in viewobj["options"]:
            # The optionView stores the image and anything that can change with the comparison view.
            optionView = {}
            optionView["label"] = str(viewobj["label"])
            optionView["db"] = dbid
            optionView["img"] = str(viewobj["img"])
            optionView["viewHeight"] = str(viewobj["viewHeight"])
            optionView["center"] = str(viewobj["center"])
            optionView["rotation"] = str(viewobj["rotation"])
            optionViews.append(optionView)

                
            # now for the info needed for display, but not put back into the database view object
            # get the option image database object to copy its info.
            imgobj2 = db["images"].find_one({'_id' : ObjectId(viewobj["img"])})
            # Start of the info object
            optionImage = {}
            optionImage["origin"] = str(imgobj2["origin"])
            optionImage["spacing"] = str(imgobj2["spacing"])
            optionImage["levels"] = str(imgobj2["levels"])
            optionImage["dimension"] = str(imgobj2["dimension"])
            #
            optionImages.append(optionImage)
    question["options"] = optionViews;
    question["optionInfo"] = optionImages;
    
    return make_response(render_template('comparison.html', question=question))


    
    
    
# returns json info needed to add a comparison to the view.
# The startup view and annotations will be the default for the option.
@mod.route('/comparison-option')
def glcomparisonoption():
    """
    - /webgl-viewer/comparison-option?db=507619bb0a3ee10434ae0827&viewid=5074528302e3100db8429cb4
    """

    # Comparison is a modified view.
    viewid = request.args.get('viewid', None)
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db', None)

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    
    viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
    imgobj = db["images"].find_one({'_id' : ObjectId(viewobj["img"])})
    bookmarkobj = db["bookmarks"].find_one({'_id':ObjectId(viewobj["startup_view"])})
    
    # The base view is for the left panel
    data = {
         'success': 1,
         'db': dbid,
         'label': imgobj["label"],
         'img': str(imgobj["_id"]),
         'center': bookmarkobj["center"],
         'origin': imgobj["origin"],
         'spacing': imgobj["spacing"],
         'levels': imgobj["levels"],
         'dimension': imgobj["dimension"],
         'rotation': bookmarkobj["rotation"]
         }

    if 'zoom' in bookmarkobj:
        data["viewHeight"] = 900 << int(bookmarkobj["zoom"])
    if 'viewHeight' in bookmarkobj:
        data["viewHeight"] = bookmarkobj["viewHeight"]

    return jsonify(data)

    
    
# Saves comparison view back into the database.
@mod.route('/comparison-save',  methods=['GET', 'POST'])
def glcomparisonsave():
    inputStr = request.form['input']  # for post
    #inputStr = request.args.get('input', "{}") # for get

    inputObj = json.loads(inputStr)
    optionArray = inputObj["Options"]
    dbid = inputObj["Viewer1"]["db"]
    viewid = inputObj["Viewer1"]["viewid"]
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    
    db["views"].update({"_id" : ObjectId(viewid) }, 
                                 { "$set" : { "options" : optionArray } })
    
    return viewid
    


# Converts a view into a comparison.
@mod.route('/comparison-convert')
def glcomparisonconvert():
    dbid = request.args.get('db', "") # for get
    viewid = request.args.get('view', "") # for get
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    
    viewobj = db["views"].update({"_id" : ObjectId(viewid) }, 
                                 { "$set" : { "type" : "comparison" } })

    return viewid


    