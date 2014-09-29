import math
from bson import ObjectId
from flask import Blueprint, request, render_template, session, make_response
from slideatlas import models, security
import json
from slideatlas.common_utils import jsonify
from copy import copy, deepcopy


def jsonifyView(db,viewid,viewobj):
    imgid = 0
    imgdb = 0
    if viewobj.has_key("ViewerRecords") :
        imgdb = viewobj["ViewerRecords"][0]["Database"]
        imgid = viewobj["ViewerRecords"][0]["Image"]
    if imgid == 0 :
        imgdb = viewobj["db"]
        imgid = viewobj["img"]

    imgobj = db["images"].find_one({'_id' : ObjectId(imgid)})

    img = {}
    img["db"] = imgdb
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

    return jsonify(img)


# view and note are the same in the new schema.
# It becomes so simple!
def glnote(db, viewid, viewobj, edit):
    email = getattr(security.current_user, 'email', '')
    return make_response(render_template('view.html', view=viewid, user=email, edit=edit))



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
    if 'Camera' in viewerRecord :
        viewerRecord["Camera"]["Roll"] = -viewerRecord["Camera"]["Roll"]
        viewerRecord["Camera"]["FocalPoint"][1] = paddedHeight - viewerRecord["Camera"]["FocalPoint"][1]
    if 'Annotations' in viewerRecord:
        for annotation in viewerRecord["Annotations"] :
            flipAnnotation(annotation, paddedHeight)

def convertImageToPixelCoordinateSystem(imageObj) :
    # origin ?

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

    # in the future, the admin database will contain everything except
    # the image data and attachments.
    admindb = models.ImageStore._get_db()
    db = admindb

    if viewid :
        viewobj = readViewTree(db, viewid)

        if ajax:
            return jsonifyView(db,viewid,viewobj)

        # default
        return glnote(db,viewid,viewobj,edit)


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
    admindb = models.ImageStore._get_db()
    db = admindb

    if viewid :
        viewobj = readViewTree(db, viewid)

        if ajax:
            return jsonifyView(db,viewid,viewobj)

        # default
        return glnote(db,viewid,viewobj,edit)


# get all the children notes for a parent (authored by a specific user).
@mod.route('/getchildnotes')
def getchildnotes():
    parentid = request.args.get('parentid', False)
    if not parentid :
        return "Error: missing parentid"

    # TODO: this should be an ObjectId by default, not a string
    user = getattr(security.current_user, 'id', '')

    admindb = models.ImageStore._get_db()
    db = admindb

    notecursor = db["views"].find({ "ParentId" : ObjectId(parentid),
                                    "User" :     user})

    # make a new structure to return.  Convert the ids to strings.
    noteArray = []
    for note in notecursor:
        # this handles viewid as an object too
        viewobj = readViewTree(db, note)
        if note.has_key("ParentId") :
            note["ParentId"] = str(note["ParentId"])
        noteArray.append(note)

    data = {}
    data["Notes"] = noteArray

    return jsonify(data)


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

    return make_response(render_template('stack.html', sess = sessid))


# stack viewer gets the stack info with ajax.
# Making this api closer and closer to stack = note.
@mod.route('/stack-session')
def glstacksession():
    """
    - /webgl-viewer/stack-session?sess=51256ae6894f5931098069d5
    """
    # Comparison is a modified view.
    sessid = request.args.get('sess')
    if not sessid:
        sessid = "51256ae6894f5931098069d5"

    admindb = models.ImageStore._get_db()
    db = admindb

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

    annotations = []
    views = []
    viewIdx = 0
    for view in sessobj.views:
        viewobj = readViewTree(db, view.ref)

        # convert annotation to stack format.
        sectionAnnotations = []
        if viewobj.has_key("ViewerRecords") and viewobj["ViewerRecords"]:
            record = viewobj["ViewerRecords"][0]
            if record.has_key("Annotations") :
                sectionAnnotations = record["Annotations"]
        annotations.append(sectionAnnotations)

        # other just that needs to be simplified
        imgdb = sessobj["image_store"]
        if viewobj.has_key("db") :
            imgdb = viewobj["db"]
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
        if imgdb == sessobj["image_store"] :
            imgobj = db["images"].find_one({'_id' : ObjectId(imgid)})
        else :
            dbobj2 = models.ImageStore.objects.with_id(imgdb)
            db2 = dbobj2.to_pymongo()
            imgobj = db2["images"].find_one({'_id' : ObjectId(imgid)})
        convertImageToPixelCoordinateSystem(imgobj)
        viewobj["img"] = imgobj

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
        myimg = viewobj["img"]

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



# This method sets the bounds of an image.
@mod.route('/set-image-bounds', methods=['GET', 'POST'])
def glsetimagebounds():
    imageId = request.form['img']  # for post
    imageDb = request.form['imgdb']  # for post
    boundsStr = request.form['bds']  # for post
    bounds = json.loads(boundsStr)

    database = models.ImageStore.objects.get_or_404(id=imageDb)
    db = database.to_pymongo()
    imgobj = db["images"].find_one({'_id' : ObjectId(imageId)})
    imgobj["bounds"] = bounds;
    db["images"].save( imgobj )

    return "Success"



# This method saves transformations and/or annotations (whatever exists in data.
@mod.route('/stack-save', methods=['GET', 'POST'])
def glstacksave():
    sessid = request.form['sess']  # for post
    dataStr = request.form['data']  # for post
    stackObj = json.loads(dataStr)

    session = models.Session.objects.get_or_404(id=sessid)

    # I do not understand the models object.
    #if 'views' in stackObj:
    #    session.views = [models.RefItem(ref=ObjectId(view['_id']), db=ObjectId(dbid)) for view in stackObj['views']]
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

    database = models.ImageStore.objects.get_or_404(id=dbid)
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
    typeStr = request.form['type'] # for post

    note = json.loads(noteStr)
    if note.has_key("ParentId") :
        note["ParentId"] = ObjectId(note["ParentId"])
    note["User"] = getattr(security.current_user, 'id', '')
    note["Type"] = typeStr

    if request.form.has_key('thumb') :
        thumbStr = request.form['thumb']
        note["Thumb"] = thumbStr

    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()

    noteId = admindb[collectionStr].save(note)
    return str(noteId)



@mod.route('/deleteusernote', methods=['GET', 'POST'])
def deleteusernote():

    noteIdStr = request.form['noteId'] # for post
    collectionStr = request.form['col'] # for post

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
    collectionStr = request.args.get('col', "views") #"favorites"

    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()

    viewItr = admindb[collectionStr].find({"User": getattr(security.current_user, 'id', ''), "Type": "Favorite"})
    viewArray = []
    for viewObj in viewItr:
        if "Type" in viewObj:
            viewObj["_id"] = str(viewObj["_id"])
            viewObj["User"] = str(viewObj["User"])
            if viewObj.has_key("ParentId") :
                viewObj["ParentId"] = str(viewObj["ParentId"])
            addviewimage(viewObj, "")
            convertViewToPixelCoordinateSystem(viewObj)
        viewArray.append(viewObj)

    data = {'viewArray': viewArray}
    return jsonify(data)


# This function reads a view from the database.  It collects all
# children sub view and image objects and puts them inline
# and returns a single structure.
def readViewTree(db, viewId) :
    if isinstance(viewId, basestring) :
        viewId = ObjectId(viewId)
    if isinstance(viewId, ObjectId) :
        viewObj = db["views"].find_one({ "_id" : viewId })
    else :
        # incase the view was already inline
        viewObj = viewId

    if viewObj == None:
        return None

    # Read and add the image objects
    if viewObj.has_key("ViewerRecords") :
        for record in viewObj["ViewerRecords"] :
            # This default does not make sense anymore
            imgdb = db
            if record.has_key("Database") :
                # convert references to string to pass to the client
                record["Database"] = str(record["Database"])
                database = models.ImageStore.objects.get_or_404(id=ObjectId(record["Database"]))
                imgdb = database.to_pymongo()
            # Replace the image reference with the inline image object for the client
            # Note: A bug caused some image objects to be embedded in views in te databse.
            if record.has_key("Image") :
                if isinstance(record["Image"], basestring) :
                    record["Image"] = ObjectId(record["Image"])
                if isinstance(record["Image"], ObjectId) :
                    imgObj = imgdb["images"].find_one({ "_id" : record["Image"]})
                    imgObj["_id"] = str(imgObj["_id"])
                    imgObj["database"] = record["Database"]
                    record["Image"] = imgObj
                convertImageToPixelCoordinateSystem(record["Image"])
                # Get rid of any lingering thumbnail images which do not jsonify.
                if record["Image"].has_key("thumb") :
                    record["Image"].pop("thumb")

    # read and add the children
    if viewObj.has_key("Children") :
        children = []
        for child in viewObj["Children"] :
            child = readViewTree(db, child)
            if child != None :
                children.append(child)
        viewObj["Children"] = children

    return viewObj


# I do not want to orphan children in the database.
# reuse id's whenever possible,

# _id is a string, but parent must be an ObjectId.
# if no _id, then a new note is created in the database.
# Save notes recursively.  Children notes are saved separately.
def savenote(db, note, user):
    note["user"] = user
    if note.has_key("_id") :
        note["_id"] = ObjectId(note["_id"])
    else :
        # We need the id to set the parent id of children.
        # put a dumy object in the database as a placeholder
        note["_id"] = db["views"].save({})

    # convert the image strings to ObjectIds.
    if note.has_key("ViewerRecords") :
        for record in note["ViewerRecords"] :
            if isinstance(record["Image"], basestring) :
                record["Image"] = ObjectId(record["Image"])
            if isinstance(record["Database"], basestring) :
                record["Database"] = ObjectId(record["Database"])

    # save the children as separate objects and keep an array of ObjectIds
    childrenRefs = []
    if note.has_key("Children") :
        for child in note["Children"]:
            child["ParentId"] = note["_id"]
            childrenRefs.append(savenote(db, child, user))
        note["Children"] = childrenRefs

    # Save the note for real.
    #db["views"].update({"_id" : ObjectId(viewId) },
    #                   { "$set" : { "notes" : notes } })


    # I do not want to orphan children in the database.
    # remove all the children before saving the note.
    # The client must set the _ids of the notes / children
    # to keep them the same.
    oldNote = db["views"].find_one({"_id":note["_id"]})
    if 'Children ' in oldNote:
        for child in oldNote["Children"] :
            if isinstance(child,ObjectId) :
                db["views"].remove({"_id":child})

    return db["views"].save(note)


# This is close to a general purpose function to insert an object into the database.
@mod.route('/saveviewnotes', methods=['GET', 'POST'])
#@security.login_required
def saveviewnotes():
    noteObj = request.form['note']
    note    = json.loads(noteObj)

    if note.has_key("ParentId") :
        note["ParentId"] = ObjectId(note["ParentId"])

    admindb = models.ImageStore._get_db()
    db = admindb

    # I was going get the user id from the session, and pass it to the viewer.
    # I think I will just try to retreive the user from the "Save Note" method.
    email = getattr(security.current_user, 'email', '')

    viewObj = savenote(db,note, email)

    # I want the client editor to display the correct links immediatly after saving, so
    # I have to return the entire note tree with any new ids created.
    viewObj = readViewTree(db, viewObj)
    return jsonify(viewObj)


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

@mod.route('/gettrackingdata')
def gettrackingdata():
    collectionStr = request.args.get('col', "tracking")

    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()

    viewItr = admindb[collectionStr].find({"User": getattr(security.current_user, 'id', '')})
    viewArray = []
    for viewObj in viewItr:
        if "Type" in viewObj :
            viewObj["_id"] = str(viewObj["_id"])
            viewObj["User"] = str(viewObj["User"])
            #viewObj["ParentId"] = str(viewObj["ParentId"])
        viewArray.append(viewObj)

    data = {'viewArray': viewArray}
    return jsonify(data)

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
    data["Database"] = dbid
    data["Images"] = imgArray
    return jsonify(data)


# get a view as a tree of notes.
@mod.route('/getview')
def getview():

    sessid = request.args.get('sessid', None)
    viewid = request.args.get('viewid', "")

    admindb = models.ImageStore._get_db()
    db = admindb

    # check the session to see if notes are hidden
    hideAnnotations = False
    if sessid :
        sessObj = models.Session.objects.with_id(sessid)
        if sessObj and sessObj.hide_annotations :
            hideAnnotations = True

    viewObj = readViewTree(db, viewid)

    # This stuff should probably go into the readViewTree function.
    # Right now, only notes use "Type"
    if "Type" in viewObj :
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

    # This is clearly the wrong default now that db is admin.
    imgdb = db
    if "db" in viewObj :
        # support for images in database different than view
        imgdb = viewObj["db"]
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
    noteObj["_id"] = viewid
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
    viewerRecord["Camera"] = {
        "Height": imgobj["dimensions"][1],
        "Roll": 0,
        "FocalPoint": [imgobj["dimensions"][0]/2, imgobj["dimensions"][1]/2,0]
    }
    viewerRecord["AnnotationVisibility"] = 2
    noteObj["ViewerRecords"] = [viewerRecord]

    noteObj["Children"] = []

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

    db = models.ImageStore._get_db()
    if dbid != "None" :
        db = models.ImageStore.objects.with_id(dbid).to_pymongo()

    imgObj = db["images"].find_one({ "_id" : ObjectId(imgid) })
    #imgObj["CoordinateSystem"] = "Pixel"
    #imgObj["bounds"] = [0, imgObj["dimensions"][0], 0, imgObj["dimensions"][1]]
    imgObj["dimensions"][0] = imgObj["dimensions"][0] / 2
    imgObj["dimensions"][1] = imgObj["dimensions"][1] / 2
    imgObj["bounds"] = [0, imgObj["dimensions"][0], 0, imgObj["dimensions"][1]]

    db["images"].save(imgObj)
    return "success"




