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
                               session_son=session_son,
                               is_session_admin=security.AdminSessionRequirement(session).can())


################################################################################
@mod.route('/sessions/<Session:session>/edit')
@security.AdminSessionRequirement.protected
def sessionedit(session):
    session_son = apiv2.SessionItemAPI._get(session, with_hidden_label=True)

    return render_template('sessionedit.html',
                           session=session,
                           session_son=session_son)


################################################################################
@mod.route('/session-save', methods=['GET', 'POST'])
def sessionsave():
    inputStr = request.form['input']  # for post

    inputObj = json.loads(inputStr)
    create_new_session = inputObj["new"]
    session_id = ObjectId(inputObj["session"])
    label = inputObj["label"]
    view_items = inputObj["views"]
    hide_annotations = inputObj["hideAnnotation"]
    stack = inputObj["stack"]

    # Todo: if session is undefined, create a new session (copy views when available).
    sessObj = models.Session.objects.with_id(session_id)

    security.AdminSessionRequirement(sessObj).test()

    new_views = list()
    for view_item in view_items:
        if 'view' in view_item:
            # updating an existing view
            view_image_store_id = ObjectId(view_item['db'])
            view_image_store = models.ImageStore.objects.get(id=view_image_store_id).to_pymongo()

            view = view_image_store['views'].find_one({'_id': ObjectId(view_item['view'])})
            if create_new_session :
                # if copying a session, copy the view objects too.
                del view['_id']
        else:
            # creating a new view from an image

            # TODO: there are way too many bugs with views not all in the same image store
            #   so, for now, put all views in the session's default image store
            view_image_store_id = sessObj.image_store.id
            view_image_store = sessObj.image_store.to_pymongo()

            view = {
                # 'view_item' should have 'img' if 'view' is not present
                'img': ObjectId(view_item['img']),
                'imgdb': ObjectId(view_item['db']),
            }
        view.update({
            'label': view_item['label'],
            'Title': view_item['label'],
            'HiddenTitle': view_item['hiddenLabel'],
        })

        # '_id' field will be added by 'save'
        # TODO: don't save until the end, to make failure transactional
        view_image_store['views'].save(view, manipulate=True)

        new_views.append(models.RefItem(
            ref=ObjectId(view['_id']),
            db=view_image_store_id
        ))

    # delete the views that are left over, as views are owned by the session.
    if not create_new_session :
        old_view_ids = set((view_ref.ref, view_ref.db) for view_ref in sessObj.views)
        new_view_ids = set((view_ref.ref, view_ref.db) for view_ref in new_views)

        removed_view_ids = old_view_ids - new_view_ids
        for removed_view_id, removed_view_image_store_id in removed_view_ids:
            removed_view_image_store = models.ImageStore.objects.get(id=removed_view_image_store_id).to_pymongo()
            removed_view_image_store['views'].remove({'_id': removed_view_id})

    # update the session
    sessObj.label = label  # I am using the label for the annotated title, and name for the hidden title.
    sessObj.views = new_views
    sessObj.hide_annotations = bool(hide_annotations)
    if stack :
      sessObj.type = "stack"
    else :
      sessObj.type = "session"

    if create_new_session :
        sessObj.user = security.current_user.email
        # TODO: it might be helpful to add a '.clone()' method to 'ModelDocument',
        #  for convenience and to properly set '_created', etc.
        sessObj.id = ObjectId()
        sessObj.save(force_insert=True)
    elif not new_views:
        sessObj.delete()
        return ""
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
