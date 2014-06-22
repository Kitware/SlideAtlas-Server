import math
from bson import ObjectId
from flask import Blueprint, request, render_template, session, make_response
from slideatlas import models, security
import json
from slideatlas.common_utils import jsonify
import pdb


# I am going to make this ajax call the standard way to load a view.
def jsonifyView(db,dbid,viewid,viewobj):
    imgid = 0
    if 'Type' in viewobj :
        if viewobj["Type"] == "Note" or viewobj["Type"] == "UserNote":
            imgid = viewobj["ViewerRecords"][0]["Image"]
    if imgid == 0 :
        imgid = viewobj["img"]

    imgobj = db["images"].find_one({'_id' : ObjectId(imgid)})

    img = {}
    img["db"] = dbid
    img["viewid"] = viewid
    img["image"] = str(imgobj["_id"])
    img["origin"] = imgobj["origin"]
    img["spacing"] = imgobj["spacing"]
    img["levels"] = 1
    if imgobj.has_key("levels") :
        img["levels"] = imgobj["levels"]
    img["dimensions"] = imgobj["dimensions"]
    if imgobj.has_key("TileSize") :
        img["TileSize"] = imgobj["TileSize"]
    else :
        img["TileSize"] = 256

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
    email = getattr(security.current_user, 'email', '')
    return make_response(render_template('view.html', sessdb=dbid, view=viewid, user=email, edit=edit))



# Flip the y-axis of a view from origin lower left, to origin upper right.
# When this is working well, I will apply it to all views in the database.
def flipAnnotation(annot, paddedHeight) :
    if annot["type"] == "text" :
        annot["offset"][1] = -annot["offset"][1] - annot["size"]
        annot["position"][1] = paddedHeight - annot["position"][1]
    if annot["type"] == "circle" :
        annot["origin"][1] = paddedHeight - annot["origin"][1]
    if annot["type"] == "polyline" :
        for point in annot["points"] :
            point[1] = paddedHeight - point[1]
    if annot["type"] == "pencil" :
        for shape in annot["shapes"] :
            for point in shape :
                point[1] = paddedHeight - point[1]



def flipViewerRecord(viewerRecord) :
    # this is wrong.  It should not be in the databse this way
    paddedHeight = 256 << (viewerRecord["Image"]["levels"] - 1)
    viewerRecord["Camera"]["Roll"] = -viewerRecord["Camera"]["Roll"]
    viewerRecord["Camera"]["FocalPoint"][1] = paddedHeight - viewerRecord["Camera"]["FocalPoint"][1]
    if viewerRecord.has_key("Annotations") :
        for annotation in viewerRecord["Annotations"] :
            flipAnnotation(annotation, paddedHeight)

def convertImageToPixelCoordinateSystem(imageObj) :
    # origin ?
    # Skip startup view.  GetView handles this old format

    if not imageObj.has_key("bounds") :
        imageObj["bounds"] = [0, imageObj["dimensions"][0], 0, imageObj["dimensions"][1]]

    if imageObj.has_key("CoordinateSystem") and imageObj["CoordinateSystem"] == "Pixel" :
        return
    # the only other option is "Photo", lower left origin.
    if imageObj.has_key("bounds") :
        # tile dimension should be stored in image schema
        paddedHeight = 256 << (imageObj["levels"] - 1)
        tmp = imageObj["bounds"][2]
        imageObj["bounds"][2] = paddedHeight-imageObj["bounds"][3]
        imageObj["bounds"][3] = paddedHeight-tmp
        imageObj["CoordinateSystem"] = "Pixel"

def convertViewToPixelCoordinateSystem(viewObj) :
    if viewObj.has_key("Children") :
        for child in viewObj["Children"] :
            convertViewToPixelCoordinateSystem(child)
    if viewObj.has_key("CoordinateSystem") and viewObj["CoordinateSystem"] == "Pixel" :
        return
    for record in viewObj["ViewerRecords"] :
        flipViewerRecord(record)
    viewObj["CoordinateSystem"] = "Pixel"

# For depreciated content.
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
    img["dimensions"] = str(imgobj["dimensions"])
    img["center"] = str(bookmarkobj["center"])
    img["rotation"] = str(bookmarkobj["rotation"])
    # hack for flip
    img["paddedHeight"] = 256 << (imgobj["levels"] - 1)

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
    img["annotations"] = annotations

    question = {}
    question["viewer1"] = img

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
            optionView["paddedHeight"] = 256 << (imgobj2["levels"] - 1)
            # Start of the info object
            optionImage = {}
            optionImage["paddedHeight"] = optionView["paddedHeight"]
            optionImage["origin"] = str(imgobj2["origin"])
            optionImage["spacing"] = str(imgobj2["spacing"])
            optionImage["levels"] = str(imgobj2["levels"])
            optionImage["dimensions"] = str(imgobj2["dimensions"])
            optionImages.append(optionImage)
    question["options"] = optionViews
    question["optionInfo"] = optionImages

    return make_response(render_template('comparison.html', question=question))



mod = Blueprint('glviewer', __name__,
                template_folder="templates",
                static_folder="static",
                url_prefix="/webgl-viewer"
                )

@mod.route('')
#@security.login_required
def glview():
    """
    - /glview?view=10239094124&db=507619bb0a3ee10434ae0827
    """
    # See if editing will be enabled.
    edit = request.args.get('edit', "false")
    # See if the user is requesting a view or session
    viewid = request.args.get('view', None)
    # get all the metadata to display a view in the webgl viewer.
    ajax = request.args.get('json', None)
    # get bookmarks. (Legacy)
    bookmarks = request.args.get('bookmarks', None)

    # this is the same as the sessions db in the sessions page.
    # TODO: Store database in the view and do not pass as arg.
    dbid = request.args.get('db', None)

    # in the future, the admin database will contain everything except
    # the image data and attachments.
    admindb = models.ImageStore._get_db()
    db = admindb
    if dbid :
        database = models.ImageStore.objects.with_id(dbid)
        db = database.to_pymongo()

    if viewid :
        viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
        if ajax:
            return jsonifyView(db,dbid,viewid,viewobj)
        if bookmarks:
            return jsonifyBookmarks(db,dbid,viewid,viewobj)

        # This will be the only path in the future. Everything else is legacy.
        if 'type' in viewobj:
            if viewobj["type"] == "comparison" :
                return glcomparison(db,dbid,viewid,viewobj)
        # default
        return glnote(db,dbid,viewid,viewobj,edit)


@mod.route('/bookmark')
#@security.login_required
def bookmark():
    """
    - /bookmark?key=0295cf24-6d51-4ce8-a923-772ebc71abb5
    """
    key = request.args.get('key', "0295cf24-6d51-4ce8-a923-772ebc71abb5")
    # find the view and the db


    return jsonify({"key" : key })


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
    dbid = request.args.get('db')

    db = models.ImageStore.objects.get_or_404(id=dbid).to_pymongo()

    if viewid :
        viewobj = db["views"].find_one({"_id" : ObjectId(viewid) })
        if ajax:
            return jsonifyView(db,dbid,viewid,viewobj)
        if bookmarks:
            return jsonifyBookmarks(db,dbid,viewid,viewobj)

      # This will be the only path in the future. Everything else is legacy.
        if 'type' in viewobj:
            if viewobj["type"] == "comparison" :
                return glcomparison(db,dbid,viewid,viewobj)
        # default
        return glnote(db,dbid,viewid,viewobj,edit)


# get all the children notes for a parent (authored by a specific user).
@mod.route('/getchildnotes')
def getchildnotes():
    parentid = request.args.get('parentid', "")
    dbid = request.args.get('db', "")
    # TODO: this should be an ObjectId by default, not a string
    user = getattr(security.current_user, 'id', '')

    admindb = models.ImageStore._get_db()
    db = admindb
    #database = models.ImageStore.objects.get_or_404(id=dbid)
    #db = database.to_pymongo()

    notecursor = db["views"].find({ "ParentId" : ObjectId(parentid),
                                    "User" :     user})
    # make a new structure to return.  Convert the ids to strings.
    noteArray = []
    for note in notecursor:
        note["Id"] = str(note["_id"])
        note["_id"] = None
        note["ParentId"] = str(note["ParentId"])
        noteArray.append(note)

    data = {}
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
    viewid = request.args.get('viewid')
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db')

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

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
         'dimensions': str(imgobj["dimensions"]),
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

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

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
        #bookmarkobj["center"] = inputStr["Viewer1"]["center"]
        #bookmarkobj["rotation"] = inputStr["Viewer1"]["rotation"]
        #bookmarkobj["height"] = inputStr["Viewer1"]["height"]
        #db["views"].update({"_id" : ObjectId(viewid) }, bookmarkobj)

    return operation


# Converts a view into a comparison.
@mod.route('/comparison-convert')
def glcomparisonconvert():
    dbid = request.args.get('db', "") # for get
    viewid = request.args.get('view', "") # for get

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

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
    sessid = request.args.get('sess')
    if not sessid:
        sessid = "51256ae6894f5931098069d5"
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db')
    if not dbid:
        dbid = "5123c81782778fd2f954a34a"

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

    return make_response(render_template('stack.html',
                         db = dbid, sess = sessid))


# stack viewer gets the stack info with ajax.
# Making this api closer and closer to stack = note.
@mod.route('/stack-session')
def glstacksession():
    """
    - /webgl-viewer/stack-session?db=5123c81782778fd2f954a34a&sess=51256ae6894f5931098069d5
    """
    # Comparison is a modified view.
    sessid = request.args.get('sess')
    if not sessid:
        sessid = "51256ae6894f5931098069d5"
    # this is the same as the sessions db in the sessions page.
    dbid = request.args.get('db')

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

    with database:
        sessobj = models.Session.objects.get_or_404(id=sessid)

    # Make a transformation if one does not exist.
    if not sessobj.transformations :
        sessobj.transformations = []
        num = len(sessobj.views)
        for idx in range(0,num-1) :
            pair = {"Correlations": []}
            pair["View0"] = sessobj.views[idx].ref
            pair["View1"] = sessobj.views[idx+1].ref
            sessobj["transformations"].append(pair)

    annotations = [];
    views = []
    viewIdx = 0
    for view in sessobj.views:
        viewobj = db["views"].find_one({"_id" : view.ref})

        # convert annotation to stack format.
        sectionAnnotations = []
        if viewobj.has_key("ViewerRecords") :
            record = viewobj["ViewerRecords"][0]
            if record.has_key("Annotations") :
                sectionAnnotations = record["Annotations"]
        annotations.append(sectionAnnotations)

        # other just that needs to be simplified
        imgdb = dbid
        if viewobj.has_key("db") :
            imgdb = viewobj["db"]
        if "imgdb" in viewobj :
            imgdb = viewobj["imgdb"]
        if "img" in viewobj :
            imgid = viewobj["img"]
        else :
            # an assumption that view is of type note.
            viewerRecord = viewobj["ViewerRecords"][0]
            if isinstance(viewerRecord["Image"], dict) :
                imgid = viewerRecord["Image"]["_id"]
                imgdb = viewerRecord["Image"]["database"]
            else :
                imgid = viewerRecord["Image"]
            if viewerRecord.has_key("Database") :
                imgdb = viewerRecord["Database"]

        # support for images from different database than the session.
        if imgdb == dbid :
            imgobj = db["images"].find_one({'_id' : ObjectId(imgid)})
        else :
            dbobj2 = models.ImageStore.objects.with_id(imgdb)
            db2 = dbobj2.to_pymongo()
            imgobj = db2["images"].find_one({'_id' : ObjectId(imgid)})
        convertImageToPixelCoordinateSystem(imgobj)

        center = [0.0,0.0]
        height = 10000.0
        # center is a legacy schema for stack.
        if viewobj.has_key("center") :
            center = viewobj["center"]
            height = viewobj["height"]
        elif imgobj.has_key("bounds") :
            center[0] = 0.5*(imgobj["bounds"][0]+imgobj["bounds"][1])
            center[1] = 0.5*(imgobj["bounds"][2]+imgobj["bounds"][3])
            height = imgobj["bounds"][3]-imgobj["bounds"][2]

        # package up variables for template
        myview = {"_id": str(viewobj["_id"]),
                  "center": center,
                  "height": height,
                  "rotation": 0,
                  "db": imgdb}
        myimg = {"dimensions": imgobj["dimensions"],
                 "bounds": imgobj["bounds"],
                 "_id": str(imgobj["_id"]),
                 "levels": imgobj["levels"]}

        myview["img"] = myimg
        views.append(myview)
        viewIdx += 1

    for pair in sessobj.transformations:
        if 'View0' in pair:
            pair["View0"] = str(pair["View0"])
            pair["View1"] = str(pair["View1"])

    for markup in sessobj.annotations:
        markup["view"] = str(markup["view"])

    return jsonify({"views":views,
                    "transformations": sessobj.transformations,
                    "annotations": annotations,
                    })


# This method saves transformations and/or annotations (whatever exists in data.
@mod.route('/stack-save', methods=['GET', 'POST'])
def glstacksave():
    dbid = request.form['db']  # for post
    sessid = request.form['sess']  # for post
    dataStr = request.form['data']  # for post
    stackObj = json.loads(dataStr)

    database = models.ImageStore.objects.get_or_404(id=dbid)

    with database:
        session = models.Session.objects.get_or_404(id=sessid)

    if 'views' in stackObj:
        session.views = [models.RefItem(ref=ObjectId(view['_id'])) for view in stackObj['views']]
    if 'transformations' in stackObj:
        # first convert all the view ids strings into ObjectIds
        for pair in stackObj["transformations"]:
            pair["View0"] = ObjectId(pair["View0"])
            pair["View1"] = ObjectId(pair["View1"])
        # Save the transformations in mongo
        session.transformations = stackObj["transformations"]
    if 'annotations' in stackObj:
        # first convert all the view ids strings into ObjectIds
        for annotation in stackObj["annotations"]:
            annotation["view"] = ObjectId(annotation["view"])
        session.annotations = stackObj["annotations"]
    session.save()

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

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

    # add the view
    view_id = db["views"].insert(viewObj)

    # I do not know the insert toan array so I will just set the whole thing
    with database:
        session = models.Session.objects.first(name='RenalStack')
    section = models.RefItem(ref=view_id)
    session.views.append(section)
    session.save()

    return "Success"


# I need to unify.  Comparison, stack and single view.
# Saves the default view back into the database.
@mod.route('/save-view', methods=['GET', 'POST'])
def glsaveview():
    messageStr = request.form['message']  # for post

    messageObj = json.loads(messageStr)
    dbid = messageObj["db"]
    viewid = inputObj["viewid"]

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

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

    return operation


# Starts a recording
# name is a way to identify a recording session.
@mod.route('/record-save', methods=['GET', 'POST'])
def glrecordsave():
    user = getattr(security.current_user, 'email', '')

    dbid      = request.form['db']  # for post
    name      = request.form['name']
    date      = request.form['date']  # used only when creating a new recording
    recordStr = request.form['record']
    record = json.loads(recordStr)

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

    recordingobj = db["recordings"].find_one({"name" : name })

    if not recordingobj:
        # construct a new object.
        recordingobj = {
            'name': name,
            'user': user,
            'date': int(date),
            'records': [record]
        }
        db["recordings"].save( recordingobj )
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

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

    toplevelcomments = db["comments"].find({ "parent": noteid })

    for obj in toplevelcomments:
        obj["_id"] = str(obj["_id"])

    return jsonify(toplevelcomments)


# The function to handle the ajax call that gets the data for a specific comment id.
@mod.route('/getcomment', methods=['GET', 'POST'])
def getcomment():
    dbid = request.form["db"]
    commentid = request.form["id"]

    database = models.ImageStore.objects.get_or_404(id=bid)
    db = database.to_pymongo()

    comment = db["comments"].find_one({"_id": ObjectId(commentid) })

    if comment:
        comment["_id"] = str(comment["_id"])

    return jsonify(comment)


# This is close to a general purpose function to insert an object into the database.
# Used to save favorites and tracking activity
# It has a bad name which can be changed later.
@mod.route('/saveusernote', methods=['GET', 'POST'])
def saveusernote():

    noteStr = request.form['note'] # for post
    collectionStr = request.form['col'] # for post

    note = json.loads(noteStr)
    note["ParentId"] = ObjectId(note["ParentId"])
    note["User"] = ObjectId(session["user_id"])
    note["Type"] = "UserNote"

    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()

    noteId = admindb[collectionStr].save(note)
    return str(noteId)



@mod.route('/deleteusernote', methods=['GET', 'POST'])
def deleteusernote():

    noteIdStr = request.form['noteId'] # for post
    collectionStr = request.form['col'] # for post
    
    #pdb.set_trace()
    
    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()

    admindb[collectionStr].remove({'_id': ObjectId(noteIdStr)})
    return "success"
    
# Save the note in a "notes" session.
# Create a notes session if it does not already exist.

# Where should we put this notes session?
# it has to be user specific. We need a rule for this specific user.
# If each user does not have his own database,
# them maybe they should have their own collection.
# There is already a user collection.  How do we get it?


def recursiveSetUser(note, user):
    note["user"] = user
    if 'Children ' in note:
        for child in note["Children"]:
            recursiveSetUser(child, user)
    
# get the favorite views for a user
# used to get favorites and recorded activity.
# it has a bad name that can be changed later.
@mod.route('/getfavoriteviews', methods=['GET', 'POST'])
def getfavoriteviews():
    collectionStr = request.args.get('col', "favorites")

    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()

    viewItr = admindb[collectionStr].find({"User": ObjectId(session["user_id"])})
    viewArray = []
    for viewObj in viewItr:
        if "Type" in viewObj :
            viewObj["_id"] = str(viewObj["_id"])
            viewObj["User"] = str(viewObj["User"])
            viewObj["ParentId"] = str(viewObj["ParentId"])
            addviewimage(viewObj, "")
            convertViewToPixelCoordinateSystem(viewObj)
        viewArray.append(viewObj)
    
    data = {'viewArray': viewArray}
    return jsonify(data)



 # This is close to a general purpose function to insert an object into the database.
@mod.route('/saveviewnotes', methods=['GET', 'POST'])
#@security.login_required
def saveviewnotes():
    dbid    = request.form['db']  # for post
    viewId  = request.form['view']
    noteObj = request.form['note']
    note    = json.loads(noteObj)

    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()

    # I was going get the user id from the session, and pass it to the viewer.
    # I think I will just try to retreive the user from the "Save Note" method.
    email = getattr(security.current_user, 'email', '')

    recursiveSetUser(note, email)

    # the root note is the view

    # Replace the viewobject with one of type 'notes'
    #viewobj = db["views"].find_one({"_id" : ObjectId(viewId) })
    # nothing to copy over except the id.
    note["_id"] = ObjectId(viewId)

    # Save the notes
    #db["views"].update({"_id" : ObjectId(viewId) },
    #                   { "$set" : { "notes" : notes } })
    db["views"].save(note)

    return str(viewId)

# Replace the image reference with an image object.
def addviewimage(viewObj, imgdb):
    for record in viewObj["ViewerRecords"]:
        # database and object (and server) should be packaged into a reference object.
        # database has some improper entries.  Image object is embedded in view.
        if isinstance(record["Image"], dict) :
            imgid = record["Image"]["_id"]
            imgdb = record["Image"]["database"]
        else :
            imgid = record["Image"]
        if record.has_key("Database") :
            imgdb = record["Database"]

        database = models.ImageStore.objects.get_or_404(id=imgdb)
        db = database.to_pymongo()
        imgObj = db["images"].find_one({ "_id" : ObjectId(imgid) })
        imgObj["_id"] = str(imgObj["_id"])
        if imgObj.has_key("thumb") :
            imgObj["thumb"] = None
        imgObj["database"] = imgdb
        if not imgObj.has_key("bounds") :
            imgObj["bounds"] = [0,imgObj["dimensions"][0], 0,imgObj["dimensions"][1]]
        convertImageToPixelCoordinateSystem(imgObj)
        record["Image"] = imgObj

    if viewObj.has_key("Children") :
        for child in viewObj["Children"]:
            addviewimage(child, imgdb)

# Get all the images in a database.  Return them as json.
@mod.route('/getimagenames')
def getimagenames():
    dbid = request.args.get('db', "")
    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()
    #imgObj = db["images"].find_one()

    imgItr = db["images"].find({}, {"label":1})
    imgArray = []
    for img in imgItr:
        img["_id"] = str(img["_id"])
        imgArray.append(img)

    data = {}
    data["Database"] = dbid
    data["Images"] = imgArray
    return jsonify(data)


# get a view as a tree of notes.
@mod.route('/getview')
def getview():
    sessid = request.args.get('sessid', None)
    viewid = request.args.get('viewid', "")
    viewdb = request.args.get('db', "")

    admindb = models.ImageStore._get_db
    db = admindb
    if viewdb and viewdb != "None" :
        database = models.ImageStore.objects.get_or_404(id=viewdb)
        db = database.to_pymongo()

    # check the session to see if notes are hidden
    hideAnnotations = False
    if sessid :
        with database:
            sessObj = models.Session.objects.with_id(sessid)
        if sessObj and sessObj.hideAnnotations :
            hideAnnotations = True

    viewObj = db["views"].find_one({ "_id" : ObjectId(viewid) })
    viewObj["Id"] = viewid
    # Right now, only notes use "Type"
    if "Type" in viewObj :
        viewObj["_id"] = str(viewObj["_id"])
        addviewimage(viewObj,viewdb)
        if hideAnnotations :
            # use a cryptic label
            viewObj["Title"] = viewObj["HiddenTitle"]
            viewObj["ViewerRecords"] = [viewObj["ViewerRecords"][0]]
            viewObj["Children"] = []

        convertViewToPixelCoordinateSystem(viewObj)
        return jsonify(viewObj)

    #---------------------------------------------------------
    # legacy: Rework bookmarks into the same structure.
    # a pain, but necessary to generalize next/previous slide.
    # An array of children and an array of ViewerRecords
    imgdb = viewdb
    if "imgdb" in viewObj :
        # support for images in database different than view
        imgdb = viewObj["imgdb"]
        database2 = models.ImageStore.objects.get_or_404(id=imgdb)
        db2 = database2.to_pymongo()
        imgobj = db2["images"].find_one({'_id' : ObjectId(viewObj["img"])})
    else :
        imgobj = db["images"].find_one({'_id' : ObjectId(viewObj["img"])})

    # mold image object to have the keys the viewer expects.
    imgobj["_id"] = str(imgobj["_id"])
    if imgobj.has_key("thumb") :
        imgobj["thumb"] = None
    imgobj["database"] = imgdb
    # open layers images are bottom justified.
    paddedHeight = 256 << (imgobj["levels"]-1)
    if not imgobj.has_key("bounds") :
        imgobj["bounds"] = [0, imgobj["dimensions"][0], paddedHeight-imgobj["dimensions"][1], paddedHeight]
    if not imgobj.has_key("TileSize") :
        imgobj["TileSize"] = 256

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
        # flip y axis
        cam["FocalPoint"][1] = paddedHeight-cam["FocalPoint"][1]
        cam["Roll"] = -bookmark["rotation"]
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
    children = []
    if 'bookmarks' in viewObj:
        for bookmarkid in viewObj["bookmarks"]:
            bookmark = db["bookmarks"].find_one({'_id':ObjectId(bookmarkid)})
            if bookmark["annotation"]["type"] == "pointer" :
                question = {}
                question["Title"] = "Question"
                question["Text"] = ""
                question["Type"] = "Bookmark"
                question["Id"] = str(bookmark["_id"])
                question["ParentId"] = viewid
                vrq = {}
                vrq["AnnotationVisibility"] = 1
                vrq["Image"] = viewerRecord["Image"]
                # camera object.
                cam = {}
                cam["FocalPoint"] = bookmark["center"]
                # flip y axis
                cam["FocalPoint"][1] = paddedHeight-cam["FocalPoint"][1]
                cam["Height"] = 900 << int(bookmark["zoom"])
                cam["Roll"] = -bookmark["rotation"]
                vrq["Camera"] = cam
                annot = {}
                annot["type"] = "text"
                # colors are wrong
                #annot["color"] = bookmark["annotation"]["color"]
                annot["color"] = "#1030FF"
                annot["size"] = 30
                annot["position"] = bookmark["annotation"]["points"][0]
                annot["offset"] = [bookmark["annotation"]["points"][1][0]-annot["position"][0],
                                   bookmark["annotation"]["points"][1][1]-annot["position"][1]]
                # flip y axis
                annot["position"][1] = paddedHeight-annot["position"][1]
                annot["offset"][1] = -annot["offset"][1]-30

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
                # flip y axis
                cam["FocalPoint"][1] = paddedHeight-cam["FocalPoint"][1]
                cam["Height"] = 900 << int(bookmark["zoom"])
                cam["Roll"] = -bookmark["rotation"]
                vrq["Camera"] = cam
                annot = {}
                annot["type"] = "circle"
                annot["color"] = bookmark["annotation"]["color"]
                annot["outlinecolor"] = bookmark["annotation"]["color"]
                annot["origin"] = bookmark["annotation"]["points"][0]
                # flip y axis
                annot["origin"][1] = paddedHeight-annot["origin"][1]

                # why does radius have value False?
                if bookmark["annotation"]["radius"] :
                    annot["radius"] = bookmark["annotation"]["radius"]
                else :
                    annot["radius"] = 1000.0
                annot["linewidth"] = annot["radius"] / 20

                vr["Annotations"] = [annot]
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


# The Bioformats uploader justified images upper left.
# fix the bounds for an image.
@mod.route('/fixjustification', methods=['GET', 'POST'])
def fixjustification():
    dbid = request.form['db']  # for post
    imgid  = request.form['img']

    db = models.ImageStore._get_db().to_pydas()
    if dbid != "None" :
        db = models.ImageStore.objects.with_id(dbid).to_pydas()

    imgObj = db["images"].find_one({ "_id" : ObjectId(imgid) })
    #imgObj["CoordinateSystem"] = "Pixel"
    #imgObj["bounds"] = [0, imgObj["dimensions"][0], 0, imgObj["dimensions"][1]]
    imgObj["dimensions"][0] = imgObj["dimensions"][0] / 2
    imgObj["dimensions"][1] = imgObj["dimensions"][1] / 2
    imgObj["bounds"] = [0, imgObj["dimensions"][0], 0, imgObj["dimensions"][1]]

    db["images"].save(imgObj)
    return "success"
