# coding=utf-8

from collections import defaultdict
from itertools import chain, groupby
import json
from operator import attrgetter

from bson import ObjectId
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
        session = models.Session.objects.get_or_404(id=sessid)
        return view_a_session(session)
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

    site_admin = models.common.AdminSitePermission() in g.identity.provides

    editable_sessions_query = all_sessions_query.can_edit(g.identity.provides)
    viewable_sessions_query = all_sessions_query.can_view_only(g.identity.provides)

    # fetch the relevant collections in bulk
    collections_by_id = {collection.id: collection for collection in
                         chain(editable_sessions_query.distinct('collection'),
                               viewable_sessions_query.distinct('collection')
                         )}

    all_sessions = defaultdict(dict)
    for sessions_query, can_admin in [
        # viewable must come first, so editable can overwrite
        (viewable_sessions_query, False),
        (editable_sessions_query, True),
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
        return render_template('sessionlist.html', all_sessions=all_sessions, site_admin=site_admin)


################################################################################
@mod.route('/sessions/<Session:session>')
@security.ViewSessionRequirement.protected
def view_a_session(session, next=None):
    # TODO: the template doesn't seem use 'next'
    next = int(request.args.get('next', 0))

    session_son = apiv2.SessionItemAPI._get(session)

    if request.args.get('json'):
        ajax_data = {
            'success': 1,
            'session' : session_son,
            'images' : [
                {
                'db': view_son['image_image_store_id'],
                'img': view_son['image_id'],
                'label': view_son['label'],
                'view': view_son['id'],
                'view_db': view_son['image_store_id'],
                # 'comparison' is no longer included, but it doesn't appear to have been used
                }
                for view_son in session_son['views']
            ],
            'attachments': session_son['attachments'],
            'db' : session.image_store.id, # TODO: deprecate and remove
            'sessid' : session.id,
            'next' : url_for('.sessions', sessid=str(session.id), ajax=1, next=next + NUMBER_ON_PAGE)
        }
        return jsonify(ajax_data)
    else:
        return render_template('session.html',
                               session=session,
                               session_son=session_son)


################################################################################
@mod.route('/sessions/<Session:session>/edit')
@security.EditSessionRequirement.protected
def sessionedit(session):
    session_son = apiv2.SessionItemAPI._get(session, with_hidden_label=True)
    #collection_son = apiv2.CollectionItemAPI._get(session_son["collection"]) # not implemented
    admindb = models.ImageStore._get_db()
    collection = admindb["collections"].find_one({"_id": session_son["collection"]});

    return render_template('sessionedit.html',
                           collection=collection["label"],
                           session=session,
                           session_son=session_son)


def deepcopyview(viewid):
    if viewid == None :
        return None
    admindb = models.ImageStore._get_db()
    view = admindb['views'].find_one({'_id': ObjectId(viewid)})
    if view == None :
        return None
    # copy children
    if view.has_key("Children") :
        newChildren = []
        for child in view["Children"] :
            new_child = deepcopyview(child)
            if new_child != None :
                newChildren.append(new_child)
        view["Children"] = newChildren

    # this forces a deep copy
    del view['_id']
    newviewid = admindb['views'].save(view)
    return newviewid;


def deleteview(viewid):
    admindb = models.ImageStore._get_db()
    view = admindb['views'].find_one({'_id': ObjectId(viewid)})
    if view == None :
        return
    # delete children
    if view.has_key("Children") :
        for child in view["Children"] :
            deleteview(child)
    # delete
    admindb['views'].remove({'_id': viewid})



################################################################################
# It is up to the client to set the view database properly when copying.
# this is a temporary pain.  Sessions has moved to admin but not views.
# We need the source db and the destination db.
# Use the viewdb var for the source.
@mod.route('/session-save', methods=['GET', 'POST'])
def sessionsave():
    inputStr = request.form['input']  # for post

    inputObj = json.loads(inputStr)
    create_new_session = inputObj["new"]
    session_id = ObjectId(inputObj["session"])
    # I assume the session uses this to get the thumbnail
    label = inputObj["label"]
    view_items = inputObj["views"]
    hide_annotations = inputObj["hideAnnotation"]
    stack = inputObj["stack"]

    admindb = models.ImageStore._get_db()

    # Todo: if session is undefined, create a new session (copy views when available).
    sessObj = models.Session.objects.with_id(session_id)

    security.EditSessionRequirement(sessObj).test()

    new_views = list()
    for view_item in view_items:
        # View or Image
        if 'view' in view_item:
            # deep or shallow copy of an existing view.
            # A bit confusing because no viewdb implies no copy unless 'create_new_session'
            if 'copy' in view_item or create_new_session:
                view_item['view'] = deepcopyview(ObjectId(view_item['view']))
            # get the view
            view = admindb['views'].find_one({'_id': ObjectId(view_item['view'])})

        else:
            # Make a new minimal note / view
            user = security.current_user.full_name if security.current_user.is_authenticated() else 'Guest'
            viewer_records = []
            viewer_records.append({
                'Image'    : ObjectId(view_item['img']),
                'Database' : ObjectId(view_item['imgdb']),
            })
            view = {
                'User'          : user,
                'Type'          : "Note",
                'SessionId'     : session_id,
                'ViewerRecords' : viewer_records
            }

        view.update({
            'Title': view_item['label'],
            'HiddenTitle': view_item['hiddenLabel'],
        });

        # TODO: don't save until the end, to make failure transactional
        admindb['views'].save(view, manipulate=True)

        # The view list in the session.  The session needs the imgdb to display the thumb.
        # At the moment, the database has many different places to find the db.
        # We will simplify this in the future.
        imgdb = None
        if view.has_key("db") :
            # the original legacy oper layers format
            imgdb = ObjectId(view["db"])
        else :
            record = view["ViewerRecords"][0]
            if record.has_key("Database") :
                # this is the correct location for the image database.
                # convert references to string to pass to the client
                imgdb = ObjectId(record["Database"])
            elif record.has_key("Image") :
                # A bug caused some image objects to be embedded in views in te databse.
                imgdb = ObjectId(record["Image"].database);

        new_views.append(models.RefItem(ref=ObjectId(view['_id']),
                                        db=imgdb))

    # delete the views that are left over, as views are owned by the session.
    if not create_new_session :
        old_view_ids = set(view_ref.ref for view_ref in sessObj.views)
        new_view_ids = set(view_ref.ref for view_ref in new_views)

        removed_view_ids = old_view_ids - new_view_ids
        for view_id in removed_view_ids:
            deleteview(view_id)

    # update the session
    sessObj.label = label  # I am using the label for the annotated title, and name for the hidden title.
    sessObj.views = new_views
    sessObj.hide_annotations = bool(hide_annotations)
    # session stacks are going away
    if stack :
      sessObj.type = "stack"
    else :
      sessObj.type = "session"

    if create_new_session :
        sessObj.user = security.current_user.email
        # TODO: it might be helpful to add a '.clone()' method to 'ModelDocument',
        #  for convenience and to properly set '_created', etc.`
        sessObj.id = ObjectId()
        sessObj.save(force_insert=True)
    else:
        sessObj.save()
    return jsonify(sessObj.to_mongo())



################################################################################
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
