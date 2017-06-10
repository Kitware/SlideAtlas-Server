# coding=utf-8

import json
from operator import itemgetter
import urllib2

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, render_template, make_response, abort

from slideatlas import models, security
from slideatlas.common_utils import jsonify

def jsonifyView(db, viewid, viewobj):
    imgdb = viewobj['ViewerRecords'][0]['Database']
    imgid = viewobj['ViewerRecords'][0]['Image']

    imgobj = db['images'].find_one({'_id': ObjectId(imgid)})

    img = {
        'db': imgdb,
        'viewid': viewid,
        'image': str(imgobj['_id']),
        'origin': imgobj['origin'],
        'spacing': imgobj['spacing'],
        'levels': 1,
        'dimensions': imgobj['dimensions'],
        'TileSize': imgobj.get('TileSize', 256)
    }
    if 'levels' in imgobj:
        img['levels'] = imgobj['levels']

    return jsonify(img)


# view and note are the same in the new schema.
# It becomes so simple!
def glnote(db, viewid, viewobj, edit):
    email = getattr(security.current_user, 'email', '')
    return make_response(render_template('view.html',
                                         view=viewid,
                                         user=email,
                                         edit=edit))



# Flip the y-axis of a view from origin lower left, to origin upper right.
# When this is working well, I will apply it to all views in the database.
def flipAnnotation(annot, paddedHeight):
    if annot["type"] == "text":
        annot["offset"][1] = -annot["offset"][1] - annot["size"]
        annot["position"][1] = paddedHeight - annot["position"][1]
    if annot["type"] == "circle":
        annot["origin"][1] = paddedHeight - annot["origin"][1]
    if annot["type"] == "polyline":
        for point in annot["points"]:
            point[1] = paddedHeight - point[1]
    if annot["type"] == "pencil":
        for shape in annot["shapes"]:
            for point in shape:
                point[1] = paddedHeight - point[1]



def flipViewerRecord(viewerRecord):
    # this is wrong.  It should not be in the databse this way
    paddedHeight = 256 << (viewerRecord["Image"]["levels"] - 1)
    if 'Camera' in viewerRecord:
        viewerRecord["Camera"]["Roll"] = -viewerRecord["Camera"]["Roll"]
        viewerRecord["Camera"]["FocalPoint"][1] = paddedHeight - viewerRecord["Camera"]["FocalPoint"][1]
    if 'Annotations' in viewerRecord:
        for annotation in viewerRecord["Annotations"]:
            flipAnnotation(annotation, paddedHeight)

def convertImageToPixelCoordinateSystem(imageObj):
    # origin ?

    if not imageObj.has_key("bounds"):
        imageObj["bounds"] = [0, imageObj["dimensions"][0], 0, imageObj["dimensions"][1]]

    # Coordinate system defaults to "Pixel" (upper left origin)
    if imageObj.has_key("CoordinateSystem") and imageObj["CoordinateSystem"] == "Photo":
        if imageObj.has_key("bounds"):
            # tile dimension should be stored in image schema
            paddedHeight = 256 << (imageObj["levels"] - 1)
            tmp = imageObj["bounds"][2]
            imageObj["bounds"][2] = paddedHeight-imageObj["bounds"][3]
            imageObj["bounds"][3] = paddedHeight-tmp
            imageObj["CoordinateSystem"] = "Pixel"

def convertViewToPixelCoordinateSystem(viewObj):
    if isinstance(viewObj, dict):
        if viewObj.has_key("Children"):
            for child in viewObj["Children"]:
                convertViewToPixelCoordinateSystem(child)
        if viewObj.has_key("CoordinateSystem") and viewObj["CoordinateSystem"] == "Photo":
            for record in viewObj["ViewerRecords"]:
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

    # if a presentation sets the sessid, but not the view,
    # I will create a new presentation object.
    sessid = request.args.get('sess', None)
    # See if the user is requesting a view or session
    viewid = request.args.get('view', None)
    if not viewid:
        abort(400)
    # See if editing will be enabled.
    edit = request.args.get('edit', "false")


    """
    - /glview?view=10239094124&db=507619bb0a3ee10434ae0827
    """
    # Option to load an image from an external server.
    scene = request.args.get('scene', None)
    if scene:
        response = urllib2.urlopen(scene)
        # this is a string
        result = response.read()
        # Take out the quotes that are giving me a pain.
        result = result.replace('"function', 'function')
        result = result.replace('}"', '}')
        # temp fix for a typo in Daniels json.
        result = result.replace("''", "'")
        return make_response(render_template('scene.html', scene = result))

    # get all the metadata to display a view in the webgl viewer.
    ajax = request.args.get('json', None)

    # in the future, the admin database will contain everything except
    # the image data and attachments.
    admindb = models.ImageStore._get_db()
    db = admindb

    if ajax:
        viewobj = None
        if viewid:
            viewobj = readViewTree(db, viewid, 0)
        return jsonifyView(db,viewid,viewobj)

    # default
    email = getattr(security.current_user, 'email', '')
    return make_response(render_template('view.html',
                                         view=viewid,
                                         user=email,
                                         sess=sessid,
                                         edit=edit))




# Query for images.  Avoids all the complications of views.
# we still search views because they have all the meta data.
# the views just vote on which image is most relavant.
@mod.route('/query')
#@security.login_required
def image_query():
    """
    - /query?words=[]
    """
    terms = request.args.get('terms', "").split()
    db = models.ImageStore._get_db()

    # I do not think the $text seach can work on individual fields
    # so I can not weight them separatly.  I would like title
    # to have more weight that text.
    db["views"].ensure_index(
        [("Title", "text"), ("Text", "text")], name="titletext")

    # build up a list of images.
    imgDict = dict()
    # I may need to search the terms separatly and add the weights
    # if the weigths do not properly increase for matches of multiple terms.
    # build up a list of images.
    # search titles (pretty important).

    for term in terms:
        viewCursor = db["views"].find({'$text': {'$search': term}},
            {'score': {"$meta": "textScore"}, "ViewerRecords": 1})
        for view in viewCursor:
            for record in view["ViewerRecords"]:
                imgId = record["Image"]
                if not imgDict.has_key(str(imgId)):
                    database = models.ImageStore.objects.get_or_404(id=ObjectId(record["Database"]))
                    imgdb = database.to_pymongo()
                    imgObj = imgdb["images"].find_one(
                        {'_id': imgId},
                        {
                            'TileSize': True,
                            'levels': True,
                            'bounds': True,
                            'label': True,
                            'dimensions': True,
                            'components': True
                        }
                    )
                    if imgObj is not None:
                        imgObj["_id"] = str(imgId)
                        imgObj["database"] = str(record["Database"])
                        imgDict[str(imgId)] = imgObj
                        imgObj["score"] = view["score"]
                        # give extra score to iamges that have the term in
                        # their labels.
                        for t in terms:
                            if imgObj["label"].lower().find(t.lower()) != -1:
                                imgObj["score"] += 2.0
                else:
                    imgObj["score"] += view["score"]

    data = dict()
    data["images"] = sorted(imgDict.values(), key=itemgetter('score'), reverse=True)
    return jsonify(data)




@mod.route('/bookmark')
#@security.login_required
def bookmark():
    """
    - /bookmark?key=0295cf24-6d51-4ce8-a923-772ebc71abb5
    """
    key = request.args.get('key', "0295cf24-6d51-4ce8-a923-772ebc71abb5")
    # find the view and the db

    return jsonify({"key": key })

    # Simple embeddable viewer.
    style = request.args.get('style', "default")
    # See if editing will be enabled.
    edit = request.args.get('edit', False)
    # See if the user is requesting a view or session
    viewid = request.args.get('view', None)
    # get all the metadata to display a view in the webgl viewer.
    ajax = request.args.get('json', None)
    admindb = models.ImageStore._get_db()
    db = admindb

    if viewid:
        viewobj = readViewTree(db, viewid, -1)

        if ajax:
            return jsonifyView(db,viewid,viewobj)

        # default
        return glnote(db,viewid,viewobj,edit,style)


# get all the children notes for a parent (authored by a specific user).
@mod.route('/getusernotes')
def getusernotes():

    parentid = request.args.get('parentid', False)
    imageid = request.args.get('imageid', False)

    # TODO: this should be an ObjectId by default, not a string
    user = getattr(security.current_user, 'id', '')
    email = getattr(security.current_user, 'email', '')

    admindb = models.ImageStore._get_db()
    db = admindb

    if parentid:
        notecursor = db["views"].find({
            'ParentId': ObjectId(parentid),
            'Type': 'UserNote',
            'User': email
        })
    elif imageid:
        notecursor = db["views"].find({
            'ViewerRecords.Image': ObjectId(imageid),
            'Type': 'UserNote',
            'User': email
        })
    else:
        return "Missing note or imageid"

    # make a new structure to return.  Convert the ids to strings.
    noteArray = []
    for note in notecursor:
        # this handles viewid as an object too
        viewobj = readViewTree(db, note,-1)
        if note.has_key("ParentId"):
            note["ParentId"] = str(note["ParentId"])
        noteArray.append(note)

    data = {
        'Notes': noteArray
    }
    return jsonify(data)


# This method sets the bounds of an image.
@mod.route('/set-image-bounds', methods=['GET', 'POST'])
def glsetimagebounds():
    imageId = request.form['img']  # for post
    imageDb = request.form['imgdb']  # for post
    boundsStr = request.form['bds']  # for post
    bounds = json.loads(boundsStr)

    database = models.ImageStore.objects.get_or_404(id=imageDb)
    db = database.to_pymongo()
    imgobj = db["images"].find_one({'_id': ObjectId(imageId)})
    imgobj["bounds"] = bounds
    db["images"].save(imgobj)

    return "Success"


# TODO: Get rid of this use move-view instead
# Temp end point to add a view to a session.
# views should belong to only a single session.
@mod.route('/session-add-view', methods=['GET', 'POST'])
def glsessionaddview():
    sessid = request.form['sess']  # for post
    viewid = request.form['view']  # for post

    session = models.Session.objects.get_or_404(id=sessid)
    session.views.insert(0, ObjectId(viewid))
    session.save()

    return "Success"


# From the session page when views are reordered in a session
@mod.route('/save-view-order', methods=['POST'])
def glsavevieworder():
    sessid = request.form['sess']  # for post
    dataStr = request.form['data']  # for post
    viewIds = json.loads(dataStr)

    session = models.Session.objects.get_or_404(id=sessid)
    session.views = []
    for i in range(len(viewIds)):
        session.views.append(ObjectId(viewIds[i]))

    session.save()

    return "Success"

# From the session page when views are delete will be used with the drag
# and drop editor too.
@mod.route('/move-view', methods=['POST'])
def moveView():
    db = models.ImageStore._get_db()

    # view has a SessionId, but I am not sure I can count on it.
    # I could do a data base search to find thefromSession, but that might
    # be expensive. Default to inserting at 0. Default to moving to trash.
    viewId = request.form['view']  # for post
    viewId = ObjectId(viewId)
    fromSessionId = None
    if request.form.has_key("from"):
        fromSessionId = request.form["from"]
    toSessionId = None
    if request.form.has_key("to"):
        toSessionId = request.form["to"]
    toPosition= 0
    if request.form.has_key("idx"):
        toPosition = int(request.form["idx"])

    if fromSessionId == None and toSessionId == None:
        return "Error: Must have a destination session or source session."

    fromSession = None
    if fromSessionId == None:
        fromSession = db["sessions"].find_one({'views':viewId});
    else:
        fromSession = db['sessions'].find_one({'_id':ObjectId(fromSessionId)})
    # check if session id is valid
    #if fromSession == None:
    #    return "Error: Could not find source session"
    # if the view is not in a session, it was probably created by the client.

    # get the toSession from the toSessionId
    if toSessionId == None:
        # find the trash session.
        collection = db["sessions"].find({'collection':fromSession["collection"]},{'label':1})
        for session in collection:
            if session['label'] == "Trash" or session['label'] == "Recycle bin":
                toSessionId = session['_id']
    if toSessionId == None:
        # create a Trash session
        trashSession = {'attachments': [],
                        'views'      : [],
                        'collection' : fromSession["collection"],
                        'label'      : 'Trash',
                        'image_store': fromSession["image_store"],
                        'type'       : "session"}
        db["sessions"].save(trashSession)
        # we need the id
        toSession = db["sessions"].find_one(trashSession)
    else:
        toSession = db["sessions"].find_one({'_id':ObjectId(toSessionId)})

    if toSession == None:
        return "Error: Problem finding destination or creating a trash collection"

    if fromSession != None:
        # check to make sure the fromSession actually has the view
        found = False
        for id in fromSession["views"]:
            if id == viewId:
                found = True
        if not found:
            return "Error: view is not in source session"

        fromSession["views"].remove(viewId)
        db["sessions"].save(fromSession)

    # if they are the same session then toSession is out of date now.
    if toSession["_id"] == fromSession["_id"]:
        toSession = fromSession

    # Should I change view["SessionId"] or get rid of this variable?
    toSession["views"].insert(toPosition,viewId)
    db["sessions"].save(toSession)

    return "Success"


# Change the hide labels flag in a session
@mod.route('/hide-labels', methods=['POST'])
def hideLabels():
    db = models.ImageStore._get_db()

    # view has a SessionId, but I am not sure I can count on it.
    # I could do a data base search to find thefromSession, but that might
    # be expensive. Default to inserting at 0. Default to moving to trash.
    sessId = request.form['sess']  # for post
    sessId = ObjectId(sessId)
    hide = request.form['hide']  # "true" or "false"

    session = db['sessions'].find_one({'_id':ObjectId(sessId)})
    if session == None:
        return "Error: Could not findsession"

    if (hide == "true"):
        session["hide_labels"] = True
    else:
        session["hide_labels"] = False

    db["sessions"].save(session)

    return "Success"


# This method saves transformations and/or annotations (whatever exists in data.
@mod.route('/stack-save', methods=['GET', 'POST'])
def glstacksave():
    sessid = request.form['sess']  # for post
    dataStr = request.form['data']  # for post
    stackObj = json.loads(dataStr)

    session = models.Session.objects.get_or_404(id=sessid)

    # I do not understand the models object.
    # if 'views' in stackObj:
    #     session.views = [ObjectId(view['_id']) for view in stackObj['views']]
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

    toplevelcomments = db["comments"].find({"parent": noteid})

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



# save a change to an image's meta data.
@mod.route('/saveimagedata', methods=['POST'])
def saveimagedata():
    imageDataStr = request.form['metadata']  # for post
    imageData = json.loads(imageDataStr)

    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()
    #imgDbObj = admindb["database"].find_one({"_id": ObjectId(imageData.database)})
    if 'database' in imageData:
        id = ObjectId(imageData['_id'])
        del imageData["_id"]
        # convert references to string to pass to the client
        database = models.ImageStore.objects.get_or_404(id=ObjectId(imageData["database"]))
        imgdb = database.to_pymongo()
        if 'TileSize' in imageData:
            del imageData['TileSize']
        if 'database' in imageData:
            del imageData['database']
        if 'metadataready' in imageData:
            del imageData['metadataready']
        imgdb["images"].update({"_id":id}, {"$set":imageData})
    return ""


# This is close to a general purpose function to insert an object into the database.
# Used to save favorites and tracking activity
# It has a bad name which can be changed later.
@mod.route('/saveusernote', methods=['GET', 'POST'])
def saveusernote():
    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()
    db = admindb    

    if request.form.has_key('type') and request.form['type'] == "Record":
        noteObj = request.form['note']
        note = json.loads(noteObj)
        user = getattr(security.current_user, 'email', '')
        note['device'] = request.form['device']
        note['type'] = "Record"
        saverecord(db, note, user)
        return ""


    # special case.  Just passed a view id to copy.
    if request.form.has_key('view'):
        # copy a view to the clipboard.
        viewId = request.form['view']
        note = admindb["views"].find_one({"_id": ObjectId(viewId)})
        note["Type"] = "Favorite"
        note["User"] = getattr(security.current_user, 'id', '')
        note["ParentId"] = note["_id"]
        note.pop("_id", None)
        if not note.has_key("Thumb"):
            r = note["ViewerRecords"][0]
            src = 'http://slide-atlas.org/thumb?db=%s&img=%s' % (r['Database'], r['Image'])
            note["Thumb"] = src
        noteId = admindb["views"].save(note)
        # TODO: Add it to a clipboard session.
        return str(noteId)

    noteStr = request.form['note']  # for post
    collectionStr = request.form['col']  # for post
    typeStr = request.form['type']  # for post

    note = json.loads(noteStr)
    if note.has_key("ParentId"):
        note["ParentId"] = ObjectId(note["ParentId"])
    note["User"] = getattr(security.current_user, 'id', '')
    note["Type"] = typeStr

    for viewer_record in note.get('ViewerRecords', list()):
        # this function is used for at least both tracking and favorites, so
        #   Image and Database fields may or may not be present
        if 'Image' in viewer_record:
            viewer_record['Image'] = ObjectId(viewer_record['Image'])
        if 'Database' in viewer_record:
            viewer_record['Database'] = ObjectId(viewer_record['Database'])
        if 'SessionId' in viewer_record:
            viewer_record['SessionId'] = ObjectId(viewer_record['SessionId'])

    if request.form.has_key('thumb'):
        thumbStr = request.form['thumb']
        note["Thumb"] = thumbStr

    noteId = admindb[collectionStr].save(note)
    return str(noteId)



@mod.route('/deleteusernote', methods=['GET', 'POST'])
def deleteusernote():

    noteIdStr = request.form['noteId']  # for post
    collectionStr = request.form['col']  # for post

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
    collectionStr = request.args.get('col', "views")  # "favorites"

    # Saving notes in admin db now.
    admindb = models.ImageStore._get_db()
    # get a list of the favorite view ids.
    viewItr = admindb[collectionStr].find(
        {
            'User': getattr(security.current_user, 'id', ''),
            'Type': 'Favorite'
        },
        {
            '_id': True
        }
    )
    viewArray = []
    for viewId in viewItr:
        viewObj = readViewTree(admindb, viewId["_id"], -1)
        # There should be no legacy views, but keep the check just in case.
        if "Type" in viewObj:
            convertViewToPixelCoordinateSystem(viewObj)
            viewArray.append(viewObj)

    data = {'viewArray': viewArray}
    return jsonify(data)


# This function reads a view from the database.  It collects all
# children sub view and image objects and puts them inline
# and returns a single structure.
def readViewTree(db, viewId, levels):
    if isinstance(viewId, basestring):
        try:
            viewId = ObjectId(viewId)
        except InvalidId:
            # viewId may come from a client-provided URL, and could be invalid
            viewId = None
    if isinstance(viewId, ObjectId):
        viewObj = db["views"].find_one({'_id': viewId})
    else:
        # in case the view was already inline
        viewObj = viewId

    if viewObj is None:
        return None

    #if not 'SessionId' in viewObj:
    sessObj = db['sessions'].find_one({'views':viewId},{'_id':True, \
                                                        'views':True, \
                                                        'hideAnnotations':True})
    if sessObj:
        viewObj['SessionId'] = sessObj['_id']
        if 'views' in sessObj:
            viewObj["Session"] = sessObj['views']
        if 'hideAnnotations' in sessObj:
            viewObj["HideAnnotations"] = sessObj['hideAnnotations']

    # Read and add the image objects
    if 'ViewerRecords' in viewObj:
        for record in viewObj['ViewerRecords']:
            # This default does not make sense anymore
            imgdb = db
            if 'Database' in record:
                # convert references to string to pass to the client
                record["Database"] = str(record["Database"])
                database = models.ImageStore.objects.get_or_404(id=ObjectId(record["Database"]))
                imgdb = database.to_pymongo()
            # Replace the image reference with the inline image object for the client
            # Note: A bug caused some image objects to be embedded in views in te database.
            if 'Image' in record:
                if isinstance(record["Image"], basestring):
                    record["Image"] = ObjectId(record["Image"])
                if isinstance(record["Image"], ObjectId):
                    imgObj = imgdb["images"].find_one({"_id": record["Image"]})
                    if imgObj is None:  # image disappeard. Use broken image.
                        database = models.ImageStore.objects.get_or_404(id=ObjectId("52a0b030554a19140a5323a9"))
                        imgdb = database.to_pymongo()
                        imgObj = imgdb["images"].find_one({"_id": "55be241b3ed65909a84cdf0c"})
                    if imgObj:
                        imgObj["_id"] = str(imgObj["_id"])
                        imgObj["database"] = record["Database"]
                        record["Image"] = imgObj
                    else:
                        record["Image"] = {}
                if imgObj:
                    convertImageToPixelCoordinateSystem(record["Image"])
                # Get rid of any lingering thumbnail images which do not jsonify.
                if 'thumb' in record['Image']:
                    del record['Image']['thumb']

    # read and add the children
    if not levels == 0 :
        if 'Children' in viewObj:
            children = []
            for child in viewObj["Children"]:
                child = readViewTree(db, child, levels - 1)
                if child is not None:
                    children.append(child)
            viewObj["Children"] = children

    # Read the user note.
    # We do not have a reference to a user note.
    # find a note with the correct user and parent.
    email = getattr(security.current_user, 'email', '')
    userViewObj = db['views'].find_one({
        'ParentId': viewId,
        'User': email,
        'Type': 'UserNote'
    })
    if userViewObj:
        # It is ok to pass in an object instead of an id.
        viewObj["UserNote"] = readViewTree(db, userViewObj, levels-1)

    return viewObj


# I do not want to orphan children in the database.
# reuse id's whenever possible,

# _id is a string, but parent must be an ObjectId.
# if no _id, then a new note is created in the database.
# Save notes recursively.  Children notes are saved separately.
def savenote(db, note, user):
    note["user"] = user
    if note.has_key("_id"):
        note["_id"] = ObjectId(note["_id"])
    else:
        # We need the id to set the parent id of children.
        # put a dumy object in the database as a placeholder
        note["_id"] = db["views"].save({})

    # convert the image strings to ObjectIds.
    if note.has_key("ViewerRecords"):
        for record in note["ViewerRecords"]:
            if isinstance(record["Image"], basestring):
                record["Image"] = ObjectId(record["Image"])
            if isinstance(record["Database"], basestring):
                record["Database"] = ObjectId(record["Database"])

    # save the children as separate objects and keep an array of ObjectIds
    childrenRefs = []
    if note.has_key("Children"):
        for child in note["Children"]:
            child["ParentId"] = note["_id"]
            childrenRefs.append(savenote(db, child, user))
        note["Children"] = childrenRefs
        # I do not want to orphan children in the database.
        # remove all the children before saving the note.
        # The client must set the _ids of the notes / children
        # to keep them the same.
        oldNote = db["views"].find_one({"_id": note["_id"]})
        if oldNote and 'Children' in oldNote:
            for child in oldNote["Children"]:
               if not child in childrenRefs:
                    db["views"].remove({"_id":child})

    # Save the note for real.
    # db["views"].update({"_id": ObjectId(viewId) },
    #                    { "$set": { "notes": notes } })

    # TODO:  see is update can be used all the time
    if note.has_key("Type"):
        return db["views"].save(note)
    else:
        id = note['_id']
        del note['_id']
        return db["views"].update({'_id':id},
                                  {'$set': note})
        
# for preston
def saverecord(db, note, user):
    note["user"] = user
    if note.has_key("_id"):
        note["_id"] = ObjectId(note["_id"])
    else:
        # We need the id to set the parent id of children.
        # put a dumy object in the database as a placeholder
        note["_id"] = db["records"].save({})

    # convert the image strings to ObjectIds.
    if note.has_key("ViewerRecords"):
        for record in note["ViewerRecords"]:
            if isinstance(record["Image"], basestring):
                record["Image"] = ObjectId(record["Image"])
            if isinstance(record["Database"], basestring):
                record["Database"] = ObjectId(record["Database"])

    # save the children as separate objects and keep an array of ObjectIds
    childrenRefs = []
    if note.has_key("Children"):
        for child in note["Children"]:
            child["ParentId"] = note["_id"]
            childrenRefs.append(savenote(db, child, user))
        note["Children"] = childrenRefs
        # I do not want to orphan children in the database.
        # remove all the children before saving the note.
        # The client must set the _ids of the notes / children
        # to keep them the same.
        oldNote = db["records"].find_one({"_id": note["_id"]})
        if oldNote and 'Children' in oldNote:
            for child in oldNote["Children"]:
               if not child in childrenRefs:
                    db["records"].remove({"_id":child})

    # Save the note for real.
    # db["views"].update({"_id": ObjectId(viewId) },
    #                    { "$set": { "notes": notes } })

    # TODO:  see is update can be used all the time
    if note.has_key("Type"):
        return db["records"].save(note)
    else:
        id = note['_id']
        del note['_id']
        return db["records"].update({'_id':id},
                                  {'$set': note})
        


# This is close to a general purpose function to insert an object into the database.
@mod.route('/saveviewnotes', methods=['GET', 'POST'])
#@security.login_required
def saveviewnotes():
    noteObj = request.form['note']
    note = json.loads(noteObj)

    if note.has_key("ParentId"):
        note["ParentId"] = ObjectId(note["ParentId"])

    admindb = models.ImageStore._get_db()
    db = admindb

    # I was going get the user id from the session, and pass it to the viewer.
    # I think I will just try to retreive the user from the "Save Note" method.
    email = getattr(security.current_user, 'email', '')

    viewObj = savenote(db,note, email)

    # TODO: This is not needed anymore.  Clients creates ids.
    # I want the client editor to display the correct links immediatly after saving, so
    # I have to return the entire note tree with any new ids created.
    #viewObj = readViewTree(db, viewObj, 0)
    return ""

# This is close to a general purpose function to insert an object into the database.
@mod.route('/savesessiontitle', methods=['GET', 'POST'])
#@security.login_required
def savesessiontitle():

    sessObj = request.form['session']
    sess = json.loads(sessObj)

    admindb = models.ImageStore._get_db()
    db = admindb

    # I was going get the user id from the session, and pass it to the viewer.
    # I think I will just try to retreive the user from the "Save Note" method.
    email = getattr(security.current_user, 'email', '')

    id = sess['_id']
    del sess['_id']
    db["sessions"].update({'_id':ObjectId(id)},
                          {'$set': sess})
    return ""

@mod.route('/gettrackingdata')
def gettrackingdata():
    admindb = models.ImageStore._get_db()

    viewItr = admindb['tracking'].find({"User": getattr(security.current_user, 'id', '')})
    viewArray = []
    for viewObj in viewItr:
        viewObj["_id"] = str(viewObj["_id"])
        viewObj["User"] = str(viewObj["User"])
        # viewObj["ParentId"] = str(viewObj["ParentId"])
        viewArray.append(viewObj)

    data = {'viewArray': viewArray}
    return jsonify(data)

# Get all the images in a database.  Return them as json.
@mod.route('/getimagenames')
def getimagenames():
    dbid = request.args.get('db', "")
    database = models.ImageStore.objects.get_or_404(id=dbid)
    db = database.to_pymongo()
    # imgObj = db["images"].find_one()

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
    #if isinstance(sessid, basestring):
    #    try:
    #        sessid = ObjectId(sessid)
    #    except InvalidId:
    #        # sessid may come from a client-provided URL, and could be invalid
    #        sessid = None
    viewid = request.args.get('viewid', None)

    admindb = models.ImageStore._get_db()

    viewObj = readViewTree(admindb, viewid, 1)
    if viewObj is None:
        abort(404)

    # I am giving the viewer the responsibility of hiding stuff.
    # copy the hide annotation from the session to the view.
    #viewObj["HideAnnotations"] = False
    #if sessid:
    #    sessObj = models.Session.objects.with_id(sessid)
    #    if sessObj and sessObj.hide_annotations:
    #        viewObj["HideAnnotations"] = True
    #        viewObj["Session"] = sessObj.views

    # This stuff should probably go into the readViewTree function.
    # Right now, only notes use "Type"
    if "Type" in viewObj:
        viewObj['HiddenTitle'] = viewObj.get('HiddenTitle', '')
        convertViewToPixelCoordinateSystem(viewObj)
        return jsonify(viewObj)

    # ---------------------------------------------------------
    # legacy: Rework bookmarks into the same structure.
    # a pain, but necessary to generalize next/previous slide.
    # An array of children and an array of ViewerRecords

    imgdb = viewObj['ViewerRecords'][0]['Database']
    image_store = models.ImageStore.objects.get_or_404(id=ObjectId(imgdb))
    image_id = viewObj['ViewerRecords'][0]['Image']
    if isinstance(image_id, dict):
        # viewerRecord has probably already been expanded inline by readViewTree
        image_id = ObjectId(image_id['_id'])

    imgobj = image_store.to_pymongo()['images'].find_one({'_id': image_id})

    # mold image object to have the keys the viewer expects.
    imgobj["_id"] = str(imgobj["_id"])
    if imgobj.has_key("thumb"):
        imgobj["thumb"] = None
    imgobj["database"] = imgdb
    # open layers images are bottom justified.
    paddedHeight = 256 << (imgobj["levels"]-1)
    if 'bounds' not in imgobj:
        imgobj['bounds'] = [
            0,
            imgobj['dimensions'][0],
            paddedHeight-imgobj['dimensions'][1],
            paddedHeight
        ]
    if 'TileSize' not in imgobj:
        imgobj['TileSize'] = 256

    noteObj = {
        '_id': viewid,
        'Title': viewObj.get('Title', imgobj['label']),
        'HiddenTitle': viewObj.get('HiddenTitle', ''),
        # Construct the ViewerRecord for the base view
        'ViewerRecords': [
            {
                'Annotations': [],
                'Image': imgobj,
                # camera object.
                'Camera': {
                    'Height': imgobj['dimensions'][1],
                    'Roll': 0,
                    'FocalPoint': [
                        (imgobj['bounds'][0] + imgobj['bounds'][1]) / 2,
                        (imgobj['bounds'][2] + imgobj['bounds'][3]) / 2,
                        0
                    ]
                },
                'AnnotationVisibility': 2
            }
        ],
        'Children': [],
    }
    if 'SessionId' in viewObj:
        noteObj['SessionId'] = str(viewObj['SessionId'])

    return jsonify(noteObj)



