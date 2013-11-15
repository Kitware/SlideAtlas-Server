import math
import mongokit
from bson import ObjectId
from flask import Blueprint, Response, abort, request, render_template, url_for, session, current_app, make_response
from slideatlas import slconn as conn, admindb, model
from slideatlas.model import Image, Session, Rule, User, Database
import json
from slideatlas.common_utils import jsonify

import pdb




# I am going to make this ajax call the standard way to load a view.
def jsonifyView(db,dbid,viewid,viewobj):
    imgid = 0
    if 'Type' in viewobj :
      if viewobj["Type"] == "Note" :
        imgid = viewobj["ViewerRecords"][0]["Image"]
    if imgid == 0 :
      imgid = viewobj["img"]
      
    imgobj = db["images"].find_one({'_id' : ObjectId(imgid)})
    
    #pdb.set_trace()
    # the official schema says dimension not dimensions. correct the schema later.
    #if 'dimension' in imgobj:
    #  imgobj['dimensions'] = imgobj['dimension']
    #  delete imgobj.dimension
    #  db["images"].save(imgobj);
    
    img = {}
    img["db"] = dbid
    img["viewid"] = viewid
    img["image"] = str(imgobj["_id"])
    img["origin"] = imgobj["origin"]
    img["spacing"] = imgobj["spacing"]
    img["levels"] = 1
    if imgobj.has_key("levels") :
      img["levels"] = imgobj["levels"]
    if 'dimensions' in imgobj:
      img["dimensions"] = imgobj["dimensions"]
    elif 'dimension' in imgobj:
      img["dimensions"] = imgobj["dimension"]

    # I want to change the schema to get rid of this startup bookmark.
    if 'startup_view' in viewobj:
      bookmarkobj = db["bookmarks"].find_one({'_id':ObjectId(viewobj["startup_view"])})
      img["center"] = bookmarkobj["center"]
      img["rotation"] = bookmarkobj["rotation"]
      if 'zoom' in bookmarkobj:
        img["viewHeight"] = 900 << int(bookmarkobj["zoom"])
      if 'viewHeight' in bookmarkobj:
        img["viewHeight"] = bookmarkobj["viewHeight"]
      
    return jsonify(img)


# bookmarks are really notes.
def jsonifyBookmarks(db, dbid, viewid, viewobj):
    # I do not think we can pass an array back.
    val = {}
    val["Bookmarks"] = []
    if 'bookmarks' in viewobj :
      for bookmarkId in viewobj["bookmarks"] :
        bookmarkObj = db["bookmarks"].find_one({'_id': bookmarkId})
        bookmark = bookmarkObj
        bookmark["_id"] = str(bookmark["_id"])
        bookmark["img"] = str(bookmark["img"])
        val["Bookmarks"].append(bookmark)

    return jsonify(val)


# view and note are the same in the new schema.
# It becomes so simple!
def glnote(db, dbid, viewid, viewobj, edit):
    # I was going get the user id from the session, and pass it to the viewer.
    # I think I will just try to retrieve the user from the "Save Note" method.
    if 'user' in session:
        email = session["user"]["email"]
    else:
        # Send the user back to login page
        # with some message
        flash("You are not logged in..", "info")
        email = None
    
    return make_response(render_template('view.html', sessdb=dbid, view=viewid, user=email, edit=edit))


def glcomparison(db, dbid, viewid, viewobj):
    imgobj = db["images"].find_one({'_id' : ObjectId(viewobj["img"])})
    bookmarkobj = db["bookmarks"].find_one({'_id':ObjectId(viewobj["startup_view"])})

    # I cannot figure out how to pass a string with newlines  and quotes
    # Templating sucks. Ajax (with JQuery) is so much better.
    #annotationsStr = json.dumps(viewobj["annotations"])
    #annotationsStr = annotationsStr.replace("&#34;","'")
    #annotationsStr = annotationsStr.replace("\n","\\n")

    # The base view is for the left panel
    img = {}
    img["db"] = dbid
    img["viewid"] = viewid
    img["image"] = str(imgobj["_id"])
    img["origin"] = str(imgobj["origin"])
    img["spacing"] = str(imgobj["spacing"])
    img["levels"] = str(imgobj["levels"])
    if 'dimension' in imgobj:
        img["dimension"] = str(imgobj["dimension"])
    elif 'dimensions' in imgobj:
        img["dimension"] = str(imgobj["dimensions"])
    img["center"] = str(bookmarkobj["center"])
    img["rotation"] = str(bookmarkobj["rotation"])
    if 'zoom' in bookmarkobj:
        img["viewHeight"] = 900 << int(bookmarkobj["zoom"])
    if 'viewHeight' in bookmarkobj:
        img["viewHeight"] = str(bookmarkobj["viewHeight"])

    # record the bookmarks as annotation.
    annotations = []
    if 'annotations' in viewobj:
        for annotation in viewobj["annotations"]:
            if 'type' in annotation:
                if annotation["type"] == "text" :
                    annotation["string"] = annotation["string"].replace("\n", "\\n")
                    annotations.append(annotation)
    img["annotations"] = annotations;

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
            if 'dimension' in imgobj2:
                optionImage["dimension"] = str(imgobj2["dimension"])
            elif 'dimensions' in imgobj2:
                optionImage["dimension"] = str(imgobj2["dimensions"])
            optionImages.append(optionImage)
    question["options"] = optionViews;
    question["optionInfo"] = optionImages;

    return make_response(render_template('comparison.html', question=question))



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
    #pdb.set_trace()
    
    # Check the user is logged in.
    rules = []
    # Compile the rules
    conn.register([Image, Session, User, Rule, Database])
    admindb = conn[current_app.config["CONFIGDB"]]
    # Assert the user is logged in
    if 'user' in session:
      name = session['user']['label']
      id = session['user']['id']
      userobj = admindb["users"].User.find_one({"_id":  ObjectId(id)})
      if userobj == None:
        # If the user is not found then something wrong 
        # Redirect the user to home with error message 
        flash("Invalid login", "error")
        return redirect(url_for('login.login'))
    else:
      # Send the user back to login page
      # with some message
      flash("You must be logged in to see that resource", "error")
      return redirect(url_for('login.login'))
    
    # See if editing will be enabled.
    edit = request.args.get('edit', False)
    # See if the user is requesting a view or session
    viewid = request.args.get('view', None)
    # get all the metadata to display a view in the webgl viewer.
    ajax = request.args.get('json', None)
    # get bookmarks. (Legacy)
    bookmarks = request.args.get('bookmarks', None)

    # this is the same as the sessions db in the sessions page.
    # TODO: Store database in the view and do not pass as arg.
    dbid = request.args.get('db', None)

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    conn.register([model.Database])    

    if viewid :
      viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
      if ajax:
        return jsonifyView(db,dbid,viewid,viewobj);
      if bookmarks:
        return jsonifyBookmarks(db,dbid,viewid,viewobj);

      # This will be the only path in the future. Everything else is legacy.
      if 'type' in viewobj:
        if viewobj["type"] == "comparison" :
          return glcomparison(db,dbid,viewid,viewobj)
      # default
      return glnote(db,dbid,viewid,viewobj,edit)



# get all the children notes for a parent (authord by a specific user).
@mod.route('/getchildnotes')
def getchildnotes():
    parentid = request.args.get('parentid', "")
    dbid = request.args.get('db', "")
    user = session["user"]["email"]
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    
    notecursor = db["notes"].find({ "ParentId" : ObjectId(parentid) })
    # make a new structure to return.  Convert the ids to strings.
    noteArray = [];
    for note in notecursor:
      note["Id"] = str(note["_id"])
      note["_id"] = None
      note["ParentId"] = str(note["ParentId"])
      noteArray.append(note)
      
    data = {};
    data["Notes"] = noteArray
    
    return jsonify(data)


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


    if 'dimension' in imgobj:
        dim = str(imgobj["dimension"])
    elif 'dimensions' in imgobj:
        dim = str(imgobj["dimensions"])


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
         'dimension': dim,
         'rotation': bookmarkobj["rotation"]
         }

    if 'zoom' in bookmarkobj:
        data["viewHeight"] = 900 << int(bookmarkobj["zoom"])
    if 'viewHeight' in bookmarkobj:
        data["viewHeight"] = bookmarkobj["viewHeight"]

    return jsonify(data)



# Saves comparison view back into the database.
@mod.route('/comparison-save', methods=['GET', 'POST'])
def glcomparisonsave():

    inputStr = request.form['input']  # for post
    operation = request.form['operation']  # for post
    #inputStr = request.args.get('input', "{}") # for get

    inputObj = json.loads(inputStr)
    dbid = inputObj["Viewer1"]["db"]
    viewid = inputObj["Viewer1"]["viewid"]

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    if operation == "options" :
        optionArray = inputObj["Options"]
        db["views"].update({"_id" : ObjectId(viewid) },
                                     { "$set" : { "options" : optionArray } })

    if operation == "view" :
        viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
        bookmarkid = viewobj["startup_view"]

        # Save the annotations
        db["views"].update({"_id" : ObjectId(viewid) },
                                     { "$set" : { "annotations" : inputObj["Viewer1"]["annotations"] } })

        # Save the startup view / bookmark
        db["bookmarks"].update({"_id" : ObjectId(bookmarkid) },
                                     { "$set" : { "center" : inputObj["Viewer1"]["center"] } })
        db["bookmarks"].update({"_id" : ObjectId(bookmarkid) },
                                     { "$set" : { "viewHeight" : inputObj["Viewer1"]["viewHeight"] } })
        db["bookmarks"].update({"_id" : ObjectId(bookmarkid) },
                                     { "$set" : { "rotation" : inputObj["Viewer1"]["rotation"] } })

                                     # may or may not work
        #bookmarkobj = db["bookmarks"].find_one({'_id':ObjectId(bookmarkid)})
        #bookmarkobj["center"] = inputStr["Viewer1"]["center"];
        #bookmarkobj["rotation"] = inputStr["Viewer1"]["rotation"];
        #bookmarkobj["height"] = inputStr["Viewer1"]["height"];
        #db["views"].update({"_id" : ObjectId(viewid) }, bookmarkobj) 


    return operation



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
 

 
# Stack viewer.
@mod.route('/stack')
def glstack():
    """
    - /webgl-viewer/stack?db=5123c81782778fd2f954a34a&sess=51256ae6894f5931098069d5
    """

    # Comparison is a modified view.
    sessid = request.args.get('sess', None)
    if not sessid:
        sessid = "51256ae6894f5931098069d5"
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db', None)
    if not dbid:
        dbid = "5123c81782778fd2f954a34a"
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    return make_response(render_template('stack.html', 
                         db = dbid, sess = sessid))
    

# stack viewer gets the stack info with ajax.
@mod.route('/stack-session')
def glstacksession():
    """
    - /webgl-viewer/stack-session?db=5123c81782778fd2f954a34a&sess=51256ae6894f5931098069d5
    """

    # Comparison is a modified view.
    sessid = request.args.get('sess', None)
    if not sessid:
        sessid = "51256ae6894f5931098069d5"
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db', None)
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    sessobj = db["sessions"].find_one({"_id" : ObjectId(sessid) })
    views = [];
    for view in sessobj["views"]:
        viewid = view["ref"]
        viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
        #viewobj["rotation"] = 0
        # Having issues with jsonify
        imgdbid = dbid
        if 'db' in viewobj:
            imgdbid = str(viewobj["db"])
        myview = {"_id": str(viewobj["_id"]),
                  "center": viewobj["center"],
                  "height": viewobj["height"],
                  "rotation": 0,
                  "db": imgdbid}
        imgobj = db["images"].find_one({"_id" : viewobj["img"] })
        #imgobj["_id"] = str(imgobj["_id"])
        #imgobj["thumb"] = ""
        myimg = {"dimensions": imgobj["dimension"],
                 "_id": str(imgobj["_id"]),
                 "levels": imgobj["levels"]}
                 
        myview["img"] = myimg
        views.append(myview)

    for pair in sessobj["transformations"]:
        if 'view0' in pair:
            pair["view0"] = str(pair["view0"])
            pair["view1"] = str(pair["view1"])

    if not 'annotations' in sessobj:
        sessobj["annotations"] = []

    for markup in sessobj["annotations"]:
        markup["view"] = str(markup["view"])

    return jsonify({"views":views, 
                    "transformations": sessobj["transformations"], 
                    "annotations": sessobj["annotations"]})

    
# This method saves transformations and/or annotations (whatever exists in data.
@mod.route('/stack-save', methods=['GET', 'POST'])
def glstacksave():
    dbid = request.form['db']  # for post
    sessid = request.form['sess']  # for post
    dataStr = request.form['data']  # for post
    stackObj = json.loads(dataStr)

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    if 'transformations' in stackObj:
        # first convert all the view ids strings into ObjectIds
        for pair in stackObj["transformations"]:
            pair["view0"] = ObjectId(pair["view0"])
            pair["view1"] = ObjectId(pair["view1"])
        # Save the transformations in mongo
        db["sessions"].update({"_id": ObjectId(sessid)}, 
                              {"$set": {"transformations": stackObj["transformations"]}})
    if 'annotations' in stackObj:
        # first convert all the view ids strings into ObjectIds
        for annotation in stackObj["annotations"]:
            annotation["view"] = ObjectId(annotation["view"])
        db["sessions"].update({"_id": ObjectId(sessid)}, 
                              {"$set": {"annotations": stackObj["annotations"]}})

    return "Success"
    
    
    
# For initial creation of the stack.  Add a view to the stack.
@mod.route('/stack-insert', methods=['GET', 'POST'])
def glstackinsert():
    dbid = request.form['db']  # for post
    imgid = request.form['img']  # for post
    camStr = request.form['cam']  # for post
    #inputStr = request.args.get('input', "{}") # for get

    viewObj = json.loads(camStr)
    viewObj["img"] = ObjectId(imgid)
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    # add the view
    view_id = db["views"].insert(viewObj)

    # I do not know the insert toan array so I will just set the whole thing
    session = db["sessions"].find_one({"name": "RenalStack" })
    #num = session["views"].length
    num = len(session["views"])
    section = {"ref": view_id, "hide": False, "pos": num}
    session["views"].append(section);
    db["sessions"].update({"name" : "RenalStack" },
                          { "$set" : { "views" : session["views"] } })

    return "Success"







# I need to unify.  Comparison, stack and single view.
# Saves the default view back into the database.
@mod.route('/save-view', methods=['GET', 'POST'])
def glsaveview():
    messageStr = request.form['message']  # for post

    messageObj = json.loads(messageStr)
    dbid = messageObj["db"]
    viewid = inputObj["viewid"]

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    if operation == "view" :
        viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
        bookmarkid = viewobj["startup_view"]

        # Save the annotations
        db["views"].update({"_id" : ObjectId(viewid) },
                                     { "$set" : { "annotations" : inputObj["Viewer1"]["annotations"] } })

        # Save the startup view / bookmark
        db["bookmarks"].update({"_id" : ObjectId(bookmarkid) },
                                     { "$set" : { "center" : inputObj["Viewer1"]["center"] } })
        db["bookmarks"].update({"_id" : ObjectId(bookmarkid) },
                                     { "$set" : { "viewHeight" : inputObj["Viewer1"]["viewHeight"] } })
        db["bookmarks"].update({"_id" : ObjectId(bookmarkid) },
                                     { "$set" : { "rotation" : inputObj["Viewer1"]["rotation"] } })

                                     # may or may not work
        #bookmarkobj = db["bookmarks"].find_one({'_id':ObjectId(bookmarkid)})
        #bookmarkobj["center"] = inputStr["Viewer1"]["center"];
        #bookmarkobj["rotation"] = inputStr["Viewer1"]["rotation"];
        #bookmarkobj["height"] = inputStr["Viewer1"]["height"];
        #db["views"].update({"_id" : ObjectId(viewid) }, bookmarkobj) 


    return operation




# Starts a recording
# name is a way to identify a recording session.

@mod.route('/record-save', methods=['GET', 'POST'])
def glrecordsave():
    user = session["user"]["email"]

    dbid      = request.form['db']  # for post
    name      = request.form['name']  
    date      = request.form['date']  # used only when creating a new recording
    recordStr = request.form['record']  
    record = json.loads(recordStr)

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    recordingobj = db["recordings"].find_one({"name" : name })
    
    if not recordingobj:
      # construct a new object.
      recordingobj = {}
      recordingobj["name"] = name
      recordingobj["user"] = user
      recordingobj["date"] = int(date)
      recordingobj["records"] = [record]
      db["recordings"].save( recordingobj );
    else :
      db["recordings"].update( {"name": name}, { "$push" : { 'records': record}}) 

    return "success"


# These methods are required to work with the note widget.
# We need to get and set the data associated with any one comment,
# get a list of all comments associated with a single note,
# and a couple of other methods for working with comment authors are needed.

# the function to get all comments associated with a single note
@mod.route('/getparentcomments', methods=['GET', 'POST'])
def getparentcomments():
    dbid = request.form['db']
    noteid = request.form["id"]
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    
    toplevelcomments = db["comments"].find({ "parent": noteid })
    
    
     
    for obj in toplevelcomments:
      obj["_id"] = str(obj["_id"])
    
    return jsonify(toplevelcomments)


# The function to handle the ajax call that gets the data for a specific comment id.
@mod.route('/getcomment', methods=['GET', 'POST'])
def getcomment():
    dbid = request.form["db"]
    commentid = request.form["id"]
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    
    comment = db["comments"].find_one({"_id": ObjectId(commentid) })
    
    if comment:
      comment["_id"] = str(comment["_id"])
    
    return jsonify(comment)

    
# This is close to a general purpose function to insert an object into the database.
@mod.route('/saveusernote', methods=['GET', 'POST'])
def saveusernote():
    dbid    = request.form['db']  # for post
    noteStr = request.form['note']  

    note    = json.loads(noteStr)
    note["ParentId"] = ObjectId(note["ParentId"]);
    # user should be set by flask so it cannot be faked.
    note["User"] = session["user"]["email"]
  
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    noteId = db["notes"].save(note);
    return str(noteId);
 

 

def recursiveSetUser(note, user):
    note["user"] = user;
    if 'Children ' in note:
      for child in note["Children"]:
          recursiveSetUser(child, user)
      
 
 # This is close to a general purpose function to insert an object into the database.
@mod.route('/saveviewnotes', methods=['GET', 'POST'])
def saveviewnotes():
    dbid    = request.form['db']  # for post
    viewId  = request.form['view']
    noteObj = request.form['note']  
    note    = json.loads(noteObj);

    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]

    # I was going get the user id from the session, and pass it to the viewer.
    # I think I will just try to retreive the user from the "Save Note" method.
    if 'user' in session:
        email = session["user"]["email"]
    else:
        # Send the user back to login page
        # with some message
        flash("You are not logged in..", "info")
        email = None
    # user should be set by flask so it cannot be faked.
    recursiveSetUser(note, email);
    
    # the root note is the view
    
    # Replace the viewobject with one of type 'notes'
    #viewobj = db["views"].find_one({"_id" : ObjectId(viewId) })
    # nothing to copy over except the id.
    note["_id"] = ObjectId(viewId) 
    
    # Save the notes
    #db["views"].update({"_id" : ObjectId(viewId) },
    #                   { "$set" : { "notes" : notes } })
    db["views"].save(note)

    return str(viewId);

# Replace the image reference with an image object.
def addviewimage(viewObj):
    for record in viewObj["ViewerRecords"]:
        # database and object (and server) should be packaged into a reference object.
        if record.has_key("Database") :
          imgid = record["Image"]
          imgdb = record["Database"]
        else :
          imgid = record["Image"]["_id"]
          imgdb = record["Image"]["database"]
        
        admindb = conn[current_app.config["CONFIGDB"]]
        dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(imgdb) })
        db = conn[dbobj["dbname"]]
        imgObj = db["images"].find_one({ "_id" : ObjectId(imgid) })
        imgObj["_id"] = str(imgObj["_id"])
        if imgObj.has_key("thumb") :
          imgObj["thumb"] = None
        imgObj["database"] = imgdb
        if 'dimension' in imgObj:
            imgObj["dimensions"] = imgObj["dimension"]
        imgObj["bounds"] = [0,imgObj["dimensions"][0], 0,imgObj["dimensions"][1]]
        record["Image"] = imgObj

    for child in viewObj["Children"]:
        addviewimage(child)

# Get all the images in a database.  Return them as json.
@mod.route('/getimagenames')
def getimagenames():
    dbid = request.args.get('db', "")
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbid) })
    db = conn[dbobj["dbname"]]
    #imgObj = db["images"].find_one()

    imgItr = db["images"].find({}, {"label":1})
    imgArray = []
    for img in imgItr:
      img["_id"] = str(img["_id"])
      imgArray.append(img)
      
    data = {};
    data["Database"] = dbid
    data["Images"] = imgArray
    return jsonify(data)    

 
# get a view as a tree of notes.
@mod.route('/getview')
def getview():
  #pdb.set_trace()
  sessid = request.args.get('sessid', None)
  viewid = request.args.get('viewid', "")
  viewdb = request.args.get('db', "")
  
  admindb = conn[current_app.config["CONFIGDB"]]
  dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(viewdb) })
  db = conn[dbobj["dbname"]]

  # check the session to see if notes are hidden
  hideAnnotations = False
  if sessid :
    sessObj = db["sessions"].find_one({ "_id" : ObjectId(sessid) })
    if sessObj.has_key("hideAnnotations") :
      if sessObj["hideAnnotations"] :
        hideAnnotations = True

  viewObj = db["views"].find_one({ "_id" : ObjectId(viewid) })
  # Right now, only notes use "Type"
  if "Type" in viewObj :
    viewObj["_id"] = str(viewObj["_id"]);
    addviewimage(viewObj)
    if hideAnnotations :
      # use a cryptic label
      viewObj["Title"] = viewObj["HiddenTitle"]
      viewObj["ViewerRecords"] = [viewObj["ViewerRecords"][0]]
      viewObj["Children"] = []
    return jsonify(viewObj)
    
  #---------------------------------------------------------
  # legacy: Rework bookmarks into the same structure.
  # a pain, but necessary to generalize next/previous slide.
  # An array of children and an array of ViewerRecords
  imgdb = viewdb
  if "imgdb" in viewObj :
    # support for images in database different than view
    imgdb = viewObj["imgdb"]
    dbobj2 = admindb["databases"].Database.find_one({ "_id" : ObjectId(imgdb) })
    db2 = conn[dbobj2["dbname"]]
    imgobj = db2["images"].find_one({'_id' : ObjectId(viewObj["img"])})
  else :
    imgobj = db["images"].find_one({'_id' : ObjectId(viewObj["img"])})

  # mold image object to have the keys the viewer expects.
  imgobj["_id"] = str(imgobj["_id"])
  imgobj["database"] = imgdb
  if imgobj.has_key("dimension") :
    imgobj["dimensions"] = imgobj["dimension"]
  imgobj["bounds"] = [0, imgobj["dimensions"][0], 0, imgobj["dimensions"][1]] 
    
  noteObj = {}
  noteObj["Id"] = viewid
  noteObj["ParentId"] = ""
  noteObj["Title"] = imgobj["label"]
  if viewObj.has_key("Title") :
    noteObj["Title"] = viewObj["Title"]
  noteObj["HiddenTitle"] = imgobj["label"]
  if viewObj.has_key("HiddenTitle") :
    noteObj["HiddenTitle"] = viewObj["HiddenTitle"]

  # Construct the ViewerRecord for the base view
  viewerRecord = {}
  viewerRecord["Annotations"] = []
  viewerRecord["Image"] = imgobj
  
  # camera object.
  cam = {}
  if 'startup_view' in viewObj:
    bookmark = db["bookmarks"].find_one({'_id':ObjectId(viewObj["startup_view"])})
    cam["FocalPoint"] = bookmark["center"]
    cam["Roll"] = bookmark["rotation"]
    if 'zoom' in bookmark:
      cam["Height"] = 900 << int(bookmark["zoom"])
    if 'viewHeight' in bookmark:
      cam["Height"] = bookmark["viewHeight"]
  else:
    cam["Height"] = imgobj["dimensions"][1]
    cam["Roll"] = 0
    cam["FocalPoint"] = [imgobj["dimensions"][0]/2, imgobj["dimensions"][1]/2,0]
  viewerRecord["Camera"] = cam
  noteObj["ViewerRecords"] = [viewerRecord]
  
  # Now for the children (Bookmarks).
  children = [];
  if 'bookmarks' in viewObj:
    for bookmarkid in viewObj["bookmarks"]:
      bookmark = db["bookmarks"].find_one({'_id':ObjectId(bookmarkid)})
      if bookmark["annotation"]["type"] == "pointer" :
        question = {}
        question["Title"] = "Question"
        question["Text"] = ""
        question["Type"] = "Bookmark"
        question["Id"] = str(bookmark["_id"]);
        question["ParentId"] = viewid
        vrq = {}
        vrq["AnnotationVisibility"] = 1
        vrq["Image"] = viewerRecord["Image"]
        # camera object.
        cam = {}
        cam["FocalPoint"] = bookmark["center"]
        cam["Height"] = 900 << int(bookmark["zoom"])
        cam["Roll"] = bookmark["rotation"]
        vrq["Camera"] = cam
        annot = {};
        annot["type"] = "text"
        # colors are wrong
        #annot["color"] = bookmark["annotation"]["color"]
        annot["color"] = "#1030FF"
        annot["size"] = 30
        annot["position"] = bookmark["annotation"]["points"][0];
        annot["offset"] = [bookmark["annotation"]["points"][1][0]-annot["position"][0], 
                           bookmark["annotation"]["points"][1][1]-annot["position"][1]]
        # problem with offsets too big or small.  (Screen pixels / fixed size)
        mag = math.sqrt((annot["offset"][0]*annot["offset"][0]) + (annot["offset"][1]*annot["offset"][1]))
        if mag == 0 :
          annot["offset"][1] = 1
          mag = 1
        if mag > 200 :
          annot["offset"][0] = annot["offset"][0] * 200 / mag
          annot["offset"][1] = annot["offset"][1] * 200 / mag
        if mag < 10 :
          annot["offset"][0] = annot["offset"][0] * 10 / mag
          annot["offset"][1] = annot["offset"][1] * 10 / mag
        annot["string"] = bookmark["title"]
        annot["anchorVisibility"] = True
        vrq["Annotations"] = [annot]
        question["ViewerRecords"] = [vrq]
        children.append(question)
        
        answer = {}
        answer["Title"] = bookmark["title"]
        answer["Text"] = bookmark["details"]
        answer["Type"] = "Bookmark"
        answer["Id"] = str(bookmark["_id"])
        answer["ParentId"] = viewid
        vra = {}
        vra["AnnotationVisibility"] = 2
        vra["Type"] = "Answer"
        vra["Image"] = viewerRecord["Image"]
        vra["Camera"] = cam
        vra["Annotations"] = [annot]
        answer["ViewerRecords"] = [vra]
        question["Children"] = [answer]

      if bookmark["annotation"]["type"] == "circle" :
        note = {}
        note["Title"] = bookmark["title"] 
        note["Text"] = bookmark["details"] 
        note["Type"] = "Bookmark"
        note["Id"] = str(bookmark["_id"])
        note["ParentId"] = viewid
        vr = {}
        vr["AnnotationVisibility"] = 1
        vr["Image"] = viewerRecord["Image"]
        # camera object.
        cam = {}
        cam["FocalPoint"] = bookmark["center"]
        cam["Height"] = 900 << int(bookmark["zoom"])
        cam["Roll"] = bookmark["rotation"]
        vrq["Camera"] = cam
        annot = {};
        annot["type"] = "circle"
        annot["color"] = bookmark["annotation"]["color"]
        annot["outlinecolor"] = bookmark["annotation"]["color"]
        annot["origin"] = bookmark["annotation"]["points"][0]
        # why does radius have value False?
        if bookmark["annotation"]["radius"] :
          annot["radius"] = bookmark["annotation"]["radius"]
        else :
          annot["radius"] = 1000.0
        annot["linewidth"] = annot["radius"] / 20
        
        vr["Annotations"] = [annot];
        note["ViewerRecords"] = [vr]
        children.append(note)

  noteObj["Children"] = children

  # it is easier to delete annotations than not generate them in the first place.
  if hideAnnotations :
    # use a cryptic label
    noteObj["Title"] = viewObj["HiddenTitle"]
    noteObj["ViewerRecords"] = [noteObj["ViewerRecords"][0]]
    noteObj["Children"] = []

  return jsonify(noteObj)
