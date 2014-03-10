# coding=utf-8

import json

from bson import ObjectId
from gridfs import GridFS
from flask import Blueprint, request, render_template, session, redirect, flash, url_for

from slideatlas import models
from slideatlas import security
from slideatlas.common_utils import jsonify

NUMBER_ON_PAGE = 10

mod = Blueprint('session', __name__)

@mod.route('/sessions')
@security.login_required
def sessions():
    """
    - /sessions  With no argument displays list of sessions accessible to current user
    - /sessions?sessid=10239094124  searches for the session id
    """
    sessid = request.args.get('sessid')
    sessdb = request.args.get('sessdb')

    if sessdb and sessid:
        return view_a_session(sessdb, sessid)
    else:
        return view_all_sessions()


def view_all_sessions():
    all_sessions = list()
    for role in security.current_user.roles:
        with role.db:
            if role.can_see_all:
                sessions = list(models.Session.objects)
            else:
                sessions = models.Session.objects.in_bulk(role.can_see).values()
        sessions.sort(key=lambda session: session.label)

        all_sessions.append((role, sessions))

    all_sessions.sort(key=lambda (role, sessions): role.name)

    if request.args.get('json'):
        # TODO: switch to using 'Content-Type: application/json' header to request JSON output
        #   this can be checked for with 'request.get_json(silent=True)' or better in Flask 0.11 with 'request.is_json()'

        #return jsonify(sessions=sessionlist, ajax=1)
        return jsonify({})  # TODO: JSON output
    else:
        return render_template('sessionlist.html', all_sessions=all_sessions)


def view_a_session(sessdb, sessid, next=None):
    database_obj = models.Database.objects.get_or_404(id=sessdb)
    with database_obj:
        session_obj = models.Session.objects.get_or_404(id=sessid)

    # TODO: the old code seemed to have a bug where it sliced the 'images' field,
    #  but iterated through the 'views' field; since the template doesn't seem use 'next'
    #  lets not change any behavior yet
    next = int(request.args.get('next', 0))

    # Confirm that the user has access
    access = any((role.db == database_obj) and (role.db_admin or role.can_see_all or (session_obj.id in role.can_see))
                 for role in security.current_user.roles)
    if not access:
        flash('Unauthorized access', 'error')
        return redirect(url_for('home'))  # TODO: is this the correct endpoint name?

    # this is a pymongo Database that we can use until all models are complete
    db = database_obj.to_pymongo()

    # iterate through the session objects
    images = list()
    for aview in session_obj.views:
        hide = aview.get('hide', False)

        viewobj = db['views'].find_one({'_id': aview['ref']})
        # Crash here. Session had a viewid that did not exist.
        # Should we clean up the broken reference? Just skip for now.
        if viewobj:
            imgid = 0
            imgdb = ""
            if "Type" in viewobj:
                # my new notes make it difficult to get the image.
                if viewobj["Type"] == "Note" :
                    if viewobj["ViewerRecords"][0].has_key("Database") :
                        imgid = viewobj["ViewerRecords"][0]["Image"]
                        imgdb = viewobj["ViewerRecords"][0]["Database"]
                    else :
                        imgid = viewobj["ViewerRecords"][0]["Image"]["_id"]
                        imgdb = viewobj["ViewerRecords"][0]["Image"]["database"]

            if imgid == 0 :
                imgdb = sessdb
                imgid = str(viewobj["img"])
            if "imgdb" in viewobj :
                imgdb = viewobj["imgdb"]
            if imgdb == sessdb :
                imgobj = db["images"].find_one({'_id' : ObjectId(imgid)}, {'_id' : 0})
            else :
                # this is a pymongo Database that we can use until all models are complete
                db2 = models.Database.objects.with_id(imgdb).to_pymongo()
                imgobj = db2["images"].find_one({'_id' : ObjectId(imgid)}, {'_id' : 0})

            # so many legacy schemas (plus hiding annotation)
            label = ""
            if "label" in imgobj:
                label = imgobj["label"]
            if "label" in aview :
                label = aview["label"]
            if "Title" in viewobj :
                label = viewobj["Title"]
            # Hide notes and descriptive title for student review
            if session_obj.hideAnnotations :
                label = viewobj["HiddenTitle"]

            if 'hide' in imgobj :
                if imgobj["hide"] :
                    hide = True
            if 'hide' in viewobj :
                if viewobj["hide"] :
                    hide = True
            if not hide :
                if imgobj.has_key("thumb"):
                    del imgobj['thumb']
                animage = {
                    'db': imgdb,
                    'img': imgid,
                    'label': label,
                    'view': str(aview["ref"])
                }
                if viewobj.get("type") == "comparison":
                    animage["comparison"] = 1

                images.append(animage)

    attachments = []
    if session_obj.attachments:
        gfs = GridFS(db, "attachments")
        for anattach in session_obj.attachments:
            fileobj = gfs.get(anattach["ref"])
            attachments.append({'name': fileobj.name, 'id' : anattach["ref"]})

    session_json = session_obj.to_mongo()
    session_json.pop('attachments', None)
    session_json.pop('images', None)

    data = {
        'success': 1,
        'session' : session_json,
        'images' : images,
        'attachments' :attachments,
        'db' : sessdb,
        'sessid' : sessid,
        'next' : url_for('session.sessions', sessid=sessid, ajax=1, next=next + NUMBER_ON_PAGE)
        }

    if request.args.get('json'):
        return jsonify(data)
    else:
        return render_template('session.html', data=data)


# change the order of views in the
@mod.route('/sessionedit')
def sessionedit():
    """
    - /session-edit?sessid=10239094124
    """
    # See if the user is requesting any session id
    sessdb = request.args.get('sessdb')
    database_obj = models.Database.objects.get_or_404(sessdb)
    sessid = request.args.get('sessid')
    with database_obj:
        session_obj = models.Session.objects.get_or_404(sessid)

    db = database_obj.to_pymongo()

    # iterate through the view objects and record image information.
    viewList = []
    for aview in session_obj.views:
        view = db["views"].find_one({"_id" : aview["ref"]})
        # missing view ????
        if view :
            descriptiveLabel = ""
            hiddenLabel = ""
            imgdb = sessdb
            if "imgdb" in view :
                imgdb = view["imgdb"]
            if "img" in view :
                imgid = view["img"]
            else :
                # an assumption that view is of type note.
                viewerRecord = view["ViewerRecords"][0]
                if viewerRecord.has_key("Database") :
                    imgid = viewerRecord["Image"]
                    imgdb = viewerRecord["Database"]
                else :
                    imgid = viewerRecord["Image"]["_id"]
                    imgdb = viewerRecord["Image"]["database"]

            # support for images from different database than the session.
            if imgdb == sessdb :
                image = db["images"].find_one({'_id' : ObjectId(imgid)})
            else :
                # this is a pymongo Database that we can use until all models are complete
                db2 = models.Database.objects.with_id(imgdb).to_pymongo()
                image = db2["images"].find_one({'_id' : ObjectId(imgid)})

            if image:
                # if nothing else, used the image label.
                if "label" in image :
                    descriptiveLabel = image["label"]
                # Legacy label of view overrides image label.
                if "label" in view :
                    descriptiveLabel = view["label"]
                # Use the note label if the view has one.
                if "Title" in view :
                    descriptiveLabel = view["Title"]
                if "HiddenTitle" in view :
                    hiddenLabel = view["HiddenTitle"]

                # thumb should be stored with the tiles, not in the image meta data.
                if image.has_key("thumb"):
                    del image['thumb']
                    db["images"].save(image)

                item = {
                    'db': imgdb, # TODO: bug here? where 'db2' isn't used sometimes instead
                    'session': sessid,
                    'img': str(imgid),
                    'descriptiveLabel': descriptiveLabel,
                    'hiddenLabel': hiddenLabel,
                    'view': str(aview["ref"])
                }
                viewList.append(item)

    data = {
        'success': 1,
        'db' : sessdb,
        'sessid' : sessid,
        'session' : session_obj.to_mongo(),
        'views' : viewList,
        'hideAnnotations' : int(session_obj.hideAnnotations)
        }

    return render_template('sessionedit.html', data=data)


# Saves comparison view back into the database.
@mod.route('/session-save', methods=['GET', 'POST'])
def sessionsave():
    inputStr = request.form['input']  # for post
    #inputStr = request.args.get('input', "{}") # for get

    inputObj = json.loads(inputStr)
    newFlag = inputObj["new"]
    dbId = inputObj["db"]
    sessId = inputObj["session"]
    label = inputObj["label"]
    views = inputObj["views"]
    hideAnnotation = inputObj["hideAnnotation"]
    stack = inputObj["stack"]

    # this is a pymongo Database that we can use until all models are complete
    db = models.Database.objects.with_id(dbId).to_pymongo()

    email = security.current_user.email

    # TODO: this will never be False, and these don't look like 'email' values
    admin = True
    if email == "all_bev1_admin" :
        admin = True
    if email == "all_paul3_admin" :
        admin = True
    if not admin :
        return ""

    # get the session in the database to modify.
    # Todo: if session is undefined, create a new session (copy views when available).
    sessObj = models.Session.objects.with_id(sessId)
    # I am using the label for the annotated title, and name for hidde
    sessObj.label = label

    # create a new list of sessions.
    oldViews = []
    if sessObj.views :
        oldViews = sessObj.views
    newViews = []
    newImages = []
    for viewData in views:
        viewId = None
        if "view" in viewData :
            viewId = viewData["view"]
        # Look for matching old views in new session
        found = False
        for index, view in enumerate(oldViews):
            if str(view["ref"]) == viewId :
                # found one.  Copy it over.
                found = True
                view["pos"] = len(newViews)
                # switch over to the new list.
                newViews.append(view)
                del oldViews[index]
                # What a pain.  Why two lists?  Deal with the image list.
                image = {}
                image["pos"] = len(newImages)
                image["hide"] = False
                viewObj = db["views"].find_one({"_id" : ObjectId(viewId) })

                viewObj["Title"] = viewData["label"]
                viewObj["HiddenTitle"] = viewData["hiddenLabel"]

                # if copying a session, copy the view objects too.
                if newFlag :
                    del viewObj["_id"]
                # have to save the view, (Title might have changed.)
                view["ref"] = db["views"].save(viewObj);
                if "img" in viewObj :
                    image["ref"] = viewObj["img"]
                else :
                    # assume view has type note.
                    image["ref"] = viewObj["ViewerRecords"][0]["Image"]
                newImages.append(image)
        if not found :
            if not viewId :
                # create a minimal new view (to be stored in db["views"]).
                viewObj = {}
                viewObj["img"] = viewData["img"]
                if viewData["db"] != dbId :
                    viewObj["imgdb"] = viewData["db"]
                viewObj["label"] = viewData["label"]
                # need to clean up the schema: viewObj:label, Title, view:label
                viewObj["Title"] = viewData["label"]
                viewObj["HiddenTitle"] = viewData["hiddenLabel"]
                viewId = db["views"].save(viewObj)
                # make a view entry on the session list
                view = {}
                view["pos"] = len(newViews)
                view["ref"] = viewId
                view["hide"] = False
                view["label"] = viewData["label"]
                newViews.append(view)
                # image
                image = {}
                image["pos"] = len(newImages)
                image["hide"] = False
                image["ref"] = ObjectId(viewData["img"])
                if viewData["db"] != dbId :
                    image["db"] = viewData["db"]
                newImages.append(image)
                #else :
                # Todo: If viewId, copy view from another session.

    # Delete the views that are left over.
    # Views are owned by the session.
    # Images can be shared.
    if not newFlag :
        for view in oldViews:
            db["views"].remove({"_id" : view["ref"] })

    sessObj.views = newViews
    sessObj.images = newImages
    sessObj.hideAnnotations = hideAnnotation
    if stack :
      sessObj.type = "stack"
    else :
      sessObj.type = "session"

    if newFlag :
        sessObj.user = email
        # TODO: it might be helpful to add a '.clone()' method to 'ModelDocument',
        #  for convenience and to properly set '_created', etc.
        sessObj.id = ObjectId()
        sessObj.save(force_insert=True)
    elif len(newViews) == 0 :
        sessObj.delete()
        return ""
    else :
        sessObj.save()

    return jsonify(sessObj.to_mongo())


@mod.route('/bookmarks')
@security.login_required
def bookmarks():
    rules = []

    id = security.current_user.id

    # Compile the rules
    # TODO: this is a hack to get a PyMongo admin DB for now, it should be changed
    admindb = models.Database._get_db()

    noteArray = []
    # TODO: why is a 'views' collection being saved in the admin DB!!!!
    for noteObj in admindb["views"].find({"User":ObjectId(id), "Type":"UserNote"}):
        noteData = {"noteid": str(noteObj["_id"]),
                    "imgid": noteObj["ViewerRecords"][0]["Image"]["_id"],
                    "imgdb": noteObj["ViewerRecords"][0]["Image"]["database"],
                    "title": noteObj["Title"]}
        noteArray.append(noteData);

    data = {"notes": noteArray}
    return render_template('notes.html', data=data)
