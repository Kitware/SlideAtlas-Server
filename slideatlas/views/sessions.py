# coding=utf-8

from collections import defaultdict
from itertools import chain, groupby
import json
from operator import attrgetter

from bson import ObjectId
from gridfs import GridFS
from flask import Blueprint, request, render_template, url_for, g

from slideatlas.api import apiv2
from slideatlas import models
from slideatlas import security
from slideatlas.common_utils import jsonify

NUMBER_ON_PAGE = 10

mod = Blueprint('session', __name__)


################################################################################
@mod.route('/sessions')
def sessions():
    """
    - /sessions  With no argument displays list of sessions accessible to current user
    - /sessions?sessid=10239094124  searches for the session id
    """
    # Support legacy requests for a single session, which use query string args
    sessid = request.args.get('sessid')

    if sessid:
        session_obj = models.Session.objects.get_or_404(id=sessid)
        return view_a_session(session_obj)
    else:
        return view_all_sessions()


################################################################################
def view_all_sessions():
    all_sessions_query = models.Session.objects\
        .only('collection', 'label', 'image_store', 'type')\
        .order_by('collection', 'label')\
        .no_dereference()
    # disable dereferencing of of sessions, to prevent running a seperate
    #   query for every single session's collection

    adminable_sessions_query = all_sessions_query.can_admin(g.identity.provides)
    viewable_sessions_query = all_sessions_query.can_view_only(g.identity.provides)

    # fetch the relevant collections in bulk
    collections_by_id = {collection.id: collection for collection in
                         chain(adminable_sessions_query.distinct('collection'),
                               viewable_sessions_query.distinct('collection')
                         )}

    all_sessions = defaultdict(dict)
    for sessions_query, can_admin in [
        # viewable must come first, so adminable can overwrite
        (viewable_sessions_query, False),
        (adminable_sessions_query, True),
        ]:
        for collection_ref, sessions in groupby(sessions_query, attrgetter('collection')):
            collection = collections_by_id[collection_ref.id]
            all_sessions[collection].update(dict.fromkeys(sessions, can_admin))

    all_sessions = [(collection, sorted(sessions_dict.iteritems(), key=lambda item: item[0].label))
                    for collection, sessions_dict
                    in sorted(all_sessions.iteritems(), key=lambda item: item[0].label)]

    if request.args.get('json'):
        ajax_sessionlist = [
            {
                'rule': collection.label,
                'sessions': [
                    {
                        'sessdb': str(session.image_store.id),
                        'sessid': str(session.id),
                        'label': session.label}
                    for session, can_admin in sessions],
            }
            for collection, sessions in all_sessions]
        user_name = security.current_user.full_name if security.current_user.is_authenticated() else 'Guest'
        return jsonify(sessions=ajax_sessionlist, name=user_name, ajax=1)
    else:
        return render_template('sessionlist.html', all_sessions=all_sessions)


################################################################################
@mod.route('/sessions/<Session:session_obj>')
@security.ViewSessionRequirement.protected
def view_a_session(session_obj, next=None):
    # TODO: the old code seemed to have a bug where it sliced the 'images' field,
    #  but iterated through the 'views' field; since the template doesn't seem use 'next'
    #  lets not change any behavior yet
    next = int(request.args.get('next', 0))

    # this is a pymongo Database that we can use until all models are complete
    database_obj = session_obj.image_store
    db = database_obj.to_pymongo()

    # iterate through the session objects
    images = list()
    for aview in session_obj.views:
        hide = aview.hide

        viewobj = db['views'].find_one({'_id': aview.ref})
        # Crash here. Session had a viewid that did not exist.
        # Should we clean up the broken reference? Just skip for now.
        if viewobj:
            imgid = 0
            imgdb = database_obj.id
            if "Type" in viewobj:
                # my new notes make it difficult to get the image.
                if viewobj["Type"] == "Note" :
                    record = viewobj["ViewerRecords"][0]
                    if isinstance(record["Image"], dict) :
                        imgid = record["Image"]["_id"]
                        imgdb = record["Image"]["database"]
                    else :
                        imgid = record["Image"]
                    if record.has_key("Database") :
                        imgdb = record["Database"]

            if imgid == 0 :
                imgid = str(viewobj["img"])
            if "imgdb" in viewobj :
                imgdb = viewobj["imgdb"]  # TODO: this is already stored as a string for zome reason
            if imgdb == database_obj.id :
                imgobj = db["images"].find_one({'_id' : ObjectId(imgid)}, {'_id' : 0})
            else :
                # this is a pymongo Database that we can use until all models are complete
                db2 = models.ImageStore.objects.with_id(imgdb).to_pymongo()
                imgobj = db2["images"].find_one({'_id' : ObjectId(imgid)}, {'_id' : 0})

            # so many legacy schemas (plus hiding annotation)
            label = ""
            if "label" in imgobj:
                label = imgobj["label"]
            if aview.label:
               label = aview.label
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
                    'view': str(aview.ref)
                }
                if viewobj.get("type") == "comparison":
                    animage["comparison"] = 1

                images.append(animage)

    attachments = apiv2.SessionAttachmentListAPI._get(session_obj)

    session_json = session_obj.to_mongo()
    session_json.pop('attachments', None)
    session_json.pop('images', None)

    data = {
        'success': 1,
        'session' : session_json,
        'images' : images,
        'attachments' :attachments,
        'db' : str(database_obj.id),
        'sessid' : str(session_obj.id),
        'next' : url_for('.sessions', sessid=str(session_obj.id), ajax=1, next=next + NUMBER_ON_PAGE)
        }

    if request.args.get('json'):
        return jsonify(data)
    else:
        is_session_admin = security.AdminSessionRequirement(session_obj).can()
        return render_template('session.html', data=data, session_obj=session_obj,
                               is_session_admin=is_session_admin)


# change the order of views in the
@mod.route('/sessions/<Session:session_obj>/edit')
@security.AdminSessionRequirement.protected
def sessionedit(session_obj):
    database_obj = session_obj.image_store
    db = database_obj.to_pymongo()

    # Iterate through the view objects and record image information.
    viewList = []
    for aview in session_obj.views:
        view = db["views"].find_one({"_id" : aview.ref})
        # I had a bug where a view was missing (broken link).
        if view :
            descriptiveLabel = ""
            hiddenLabel = ""
            imgid = 0
            imgdb = database_obj.id
            if "imgdb" in view :
                imgdb = view["imgdb"]
            if "img" in view :
                imgid = view["img"]
            else :
                # an assumption that view is of type note.
                viewerRecord = view["ViewerRecords"][0]
                if isinstance(viewerRecord["Image"], dict) :
                    imgid = viewerRecord["Image"]["_id"]
                    imgdb = viewerRecord["Image"]["database"]
                else :
                    imgid = viewerRecord["Image"]
                if viewerRecord.has_key("Database") :
                    imgdb = viewerRecord["Database"]

            # support for images from different database than the session.
            if imgdb == database_obj.id :
                image = db["images"].find_one({'_id' : ObjectId(imgid)})
            else :
                # this is a pymongo Database that we can use until all models are complete
                db2 = models.ImageStore.objects.with_id(imgdb).to_pymongo()
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
                    'session': str(session_obj.id),
                    'img': str(imgid),
                    'descriptiveLabel': descriptiveLabel,
                    'hiddenLabel': hiddenLabel,
                    'view': str(aview.ref)
                }
                viewList.append(item)

    data = {
        'success': 1,
        'database' : database_obj,
        'session' : session_obj,
        'views' : viewList,
        'hideAnnotations' : session_obj.hideAnnotations
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
    db = models.ImageStore.objects.with_id(dbId).to_pymongo()

    # Todo: if session is undefined, create a new session (copy views when available).
    sessObj = models.Session.objects.with_id(sessId)

    security.AdminSessionRequirement(sessObj).test()

    email = security.current_user.email

    # I am using the label for the annotated title, and name for the hidden title.
    sessObj.label = label

    # create a new list of views.
    oldViews = []
    if sessObj.views :
        oldViews = sessObj.views
    newViews = []
    newImages = []
    for viewData in views:
        viewId = None
        if "view" in viewData :
            viewId = ObjectId(viewData["view"])
        # Look for matching old views in new session
        found = False
        for index, view in enumerate(oldViews):
            if view.ref == viewId :
                # found one.  Copy it over.
                found = True
                # switch over to the new list.
                newViews.append(view)
                del oldViews[index]
                # What a pain.  Why two lists?  Deal with the image list.
                image = models.RefItem()
                viewObj = db["views"].find_one({"_id" : ObjectId(viewId) })

                viewObj["Title"] = viewData["label"]
                viewObj["HiddenTitle"] = viewData["hiddenLabel"]

                # if copying a session, copy the view objects too.
                if newFlag :
                    del viewObj["_id"]
                # have to save the view, (Title might have changed.)
                view.ref = db["views"].save(viewObj);
                if "img" in viewObj :
                    image.ref = ObjectId(viewObj["img"])
                else :
                    img = viewObj["ViewerRecords"][0]["Image"]
                    if isinstance(img, ObjectId) :
                        # Correct
                        image.ref = img
                    if isinstance(img, basestring) :
                        # OK, but image should really be an ObjectId
                        image.ref = ObjectId(img)
                    if isinstance(img, dict) :
                        # bug: Whole image object was saved inline.
                        image.ref = ObjectId(img["_id"])

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
                view = models.RefItem(ref=viewId, label=viewData["label"])
                newViews.append(view)
                # image
                image = models.RefItem(ref=ObjectId(viewData["img"]))
                if viewData["db"] != dbId :
                    image.db = viewData["db"]
                newImages.append(image)
                #else :
                # Todo: If viewId, copy view from another session.

    # Delete the views that are left over.
    # Views are owned by the session.
    # Images can be shared.
    if not newFlag :
        for view in oldViews:
            db["views"].remove({"_id" : view.ref })

    sessObj.views = newViews
    sessObj.images = newImages
    sessObj.hideAnnotations = bool(hideAnnotation)
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
    admindb = models.ImageStore._get_db()

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
