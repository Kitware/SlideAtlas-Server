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
def sessions_view():
    """
    - /sessions  With no argument displays list of sessions accessible to current user
    - /sessions?sessid=10239094124  searches for the session id
    """

    # Support legacy requests for a single session, which use query string args
    session_id = request.args.get('sessid')

    if session_id:
        session = models.Session.objects.get_or_404(id=session_id)
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
    all_collections_query = models.Collection.objects\
        .no_dereference()

    can_admin_collection_ids = [collection.id for collection in all_collections_query.can_access(g.identity.provides , models.Operation.admin)]

    editable_sessions_query = all_sessions_query.can_access(g.identity.provides, models.Operation.edit)
    viewable_sessions_query = all_sessions_query.can_access(g.identity.provides, models.Operation.view, strict_operation=True)

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

    all_sessions = [(collection,
                    True if collection.id in can_admin_collection_ids else False,
                    sorted(sessions_dict.iteritems(), key=lambda item: item[0].label)
                    )
                    for collection, sessions_dict
                    in sorted(all_sessions.iteritems(), key=lambda item: item[0].label)]

    # Whether to include administrative javascript
    is_admin = bool(len(can_admin_collection_ids))

    if request.args.get('json'):
        ajax_session_list = [
            {
                'rule': collection.label,
                'can_admin': can_admin,
                'sessions': [
                    {
                        'sessdb': str(session.image_store.id),
                        'sessid': str(session.id),
                        'label': session.label
                    }
                    for session, can_admin in sessions],
            }
            for collection, can_admin, sessions in all_sessions]
        user_name = security.current_user.full_name if security.current_user.is_authenticated() else 'Guest'
        return jsonify(sessions=ajax_session_list, name=user_name, ajax=1)
    else:
        return render_template('sessionlist.html', all_sessions=all_sessions, is_admin=is_admin)


################################################################################
@mod.route('/sessions/<Session:session>')
@security.ViewSessionRequirement.protected
def view_a_session(session):
    # TODO: the template doesn't seem use 'next'
    next_arg = int(request.args.get('next', 0))

    session_son = apiv2.SessionItemAPI._get(session)

    if request.args.get('json'):
        images = []
        for view_son in session_son['views']:
            database = models.ImageStore.objects.get_or_404(id=view_son['image_store_id'])
            imgdb = database.to_pymongo()
            imgObj = imgdb["images"].find_one({ "_id" : view_son['image_id']})
            bounds = [0,imgObj['dimensions'][0], 0, imgObj['dimensions'][1]]
            if 'bounds' in imgObj:
                bounds = imgObj['bounds']
            tileSize = 256
            if 'tile_size' in imgObj:
                tileSize = imgObj['tile_size']
            if 'tileSize' in imgObj:
                tileSize = imgObj['tileSize']
            if 'TileSize' in imgObj:
                tileSize = imgObj['TileSize']
            images.append({
                    'db': view_son['image_store_id'],
                    'img': view_son['image_id'],
                    'label': view_son['label'],
                    'view': view_son['id'],
                    'bounds': bounds,
                    'tile_size': tileSize,
                    'levels': imgObj['levels'],
                    'dimensions': imgObj['dimensions']
                })

        ajax_data = {
            'success': 1,
            'session': session_son,
            'images': images,
            'attachments': session_son['attachments'],
            'imagefiles': session_son["imagefiles"],
            'db': session.image_store.id,  # TODO: deprecate and remove
            'sessid': session.id,
            'next': url_for('.sessions_view', sessid=str(session.id), ajax=1, next=next_arg + NUMBER_ON_PAGE)
        }
        return jsonify(ajax_data)
    else:
        return render_template('session.html',
                               session=session,
                               session_son=session_son)


################################################################################
@mod.route('/sessions/<Session:session>/edit')
@security.EditSessionRequirement.protected
def session_edit_view(session):
    session_son = apiv2.SessionItemAPI._get(session, with_hidden_label=True)

    return render_template('sessionedit.html',
                           gallery=1,
                           collection=session.collection,
                           session=session,
                           session_son=session_son)


################################################################################
@mod.route('/collections/<Collection:collection>/edit')
def collection_edit_view(collection):
    return render_template('collectionedit.html',
                           collection=collection)


################################################################################
@mod.route('/sessions/<Session:session>/newstack')
@security.EditSessionRequirement.protected
def session_new_stack(session):
    session_son = apiv2.SessionItemAPI._get(session, with_hidden_label=True)

    return render_template('sessionNewStack.html',
                           collection=session.collection,
                           session=session,
                           session_son=session_son)

################################################################################
def deepcopyview(view_id):

    if view_id is None:
        return None
    admin_db = models.ImageStore._get_db()
    view = admin_db['views'].find_one({'_id': ObjectId(view_id)})
    if view is None:
        return None
    # copy children
    # Also replace references to children in the html text.
    if 'Children' in view:
        new_children = []
        for child in view['Children']:
            new_child = deepcopyview(child)
            if new_child is not None:
                new_children.append(new_child)
        view['Children'] = new_children

    # There is probably a better way of getting a
    # new id that saving.  We have to save twice here.
    # We have to replace the oldId string with the new for html text.
    oldId = view['_id']
    # Lets save the old Id.  It might be userful for remeber the original
    # view
    view['CopySource'] = oldId
    # this forces a deep copy
    del view['_id']
    newId = view['_id'] = admin_db['views'].save(view)
    # Replace the old id with the new id in the text.
    if 'Text' in view :
        view["Text"] = view["Text"].replace(str(oldId),str(newId))
    # a second save for the updated html text.
    admin_db['views'].save(view)

    return newId


################################################################################
@mod.route('/session-save', methods=['GET', 'POST'])
def session_save_view():
    input_str = request.form['input']  # for post

    input_obj = json.loads(input_str)
    session_id = ObjectId(input_obj['session'])
    # I assume the session uses this to get the thumbnail
    label = input_obj['label']
    view_items = input_obj['views']
    # I am using this endpoint for the session editor and the collection editor.
    # The collection editor can move views from one session to another.
    # In this case, we do not want to delete orphaned views.
    delete_views = False
    if 'delete_views' in input_obj:
        delete_views = input_obj["delete_views"]

    admindb = models.ImageStore._get_db()

    # Todo: if session is undefined, create a new session (copy views when available).
    session = models.Session.objects.with_id(session_id)

    security.EditSessionRequirement(session).test()

    if 'hideAnnotation' in input_obj:
        session.hide_annotations = bool(input_obj['hideAnnotation'])

    new_views = list()

    for view_item in view_items:
        # View or Image
        if 'view' in view_item:
            # deep or shallow copy of an existing view.
            # A bit confusing because no viewdb implies no copy unless 'create_new_session'
            if 'copy' in view_item and view_item['copy']:
                view_item['view'] = deepcopyview(ObjectId(view_item['view']))
            # get the view
            view = admindb['views'].find_one({'_id': ObjectId(view_item['view'])})
        else:
            # Make a new minimal note / view
            user = security.current_user.full_name if security.current_user.is_authenticated() else 'Guest'
            viewer_records = [{
                'Image': ObjectId(view_item['img']),
                'Database': ObjectId(view_item['imgdb']),
            }]
            view = {
                'User': user,
                'Type': 'Note',
                'SessionId': session_id,
                'ViewerRecords': viewer_records
            }

        # The client now knows when hide annotations is on and
        # always knows both the label and hidden label.
        if 'hiddenLabel' in view_item:
            view['HiddenTitle'] = view_item['hiddenLabel']
        if 'label' in view_item:
            view['Title'] = view_item['label']

        # TODO: don't save until the end, to make failure transactional
        admindb['views'].save(view, manipulate=True)

        new_views.append(ObjectId(view['_id']))

    # delete the views that are left over, as views are owned by the session.
    # TODO: I would like to add deleted views to a trash session.
    # There would be a chance of recovery ...
    if delete_views:
        removed_view_ids = set(session.views) - set(new_views)
        for view_id in removed_view_ids:
            apiv2.SessionViewItemAPI._delete(view_id)

    # update the session
    session.label = label  # I am using the label for the annotated title, and name for the hidden title.
    session.views = new_views

    session.type = 'session'

    session.save()
    return jsonify(session.to_mongo())




################################################################################
@mod.route('/session-save-stack', methods=['GET', 'POST'])
def session_save_stack():
    input_str = request.form['input']  # for post
    input_obj = json.loads(input_str)
    session_id = ObjectId(input_obj['sessId'])
    label = input_obj['label']
    stack_items = input_obj['items']


    admindb = models.ImageStore._get_db()
    session = models.Session.objects.with_id(session_id)
    security.EditSessionRequirement(session).test()

    records = list()

    for item in stack_items:
        camera = {'FocalPoint': [item['x'], item['y'], 0],
                  'Height':     item['height'],
                  'Roll':       item['roll']}
        viewer_record = {
            'Image': ObjectId(item['img']),
            'Database': ObjectId(item['db']),
            'Camera' : camera}
        if 'widget' in item :
            viewer_record['Annotations'] = [item['widget']];
        records.append(viewer_record)


    for idx in range(1,len(stack_items)) :
        item0 = stack_items[idx-1]
        item1 = stack_items[idx]
        correlationHeight = (item0['height']+item1['height'])*0.5;
        records[idx]['Transform'] = {'Correlations':[{'point0': [item0['x'], item0['y']],
                                                      'point1': [item1['x'], item1['y']],
                                                      'roll':   item1['roll']-item0['roll'],
                                                      'height': correlationHeight } ]}

    # Now make the view
    user = security.current_user.id if security.current_user.is_authenticated() else 'Guest'
    view = {
        'CoordinateSystem': 'Pixel',
        'User': user,
        'Type': 'Stack',
        'ViewerRecords': records,
        'Title': label,
        'HiddenTitle': label
    }
    # TODO: don't save until the end, to make failure transactional
    admindb['views'].save(view, manipulate=True)


    # update the session
    session.views.insert(0, view['_id'])
    session.save()
    return jsonify(view)



################################################################################
@mod.route('/bookmarks')
@security.login_required
def bookmarks_view():
    user_id = security.current_user.id

    # Compile the rules
    # TODO: this is a hack to get a PyMongo admin DB for now, it should be changed
    admin_db = models.ImageStore._get_db()

    note_array = []
    # TODO: why is a 'views' collection being saved in the admin DB!!!!
    for note_obj in admin_db['views'].find({'User': user_id, 'Type': 'UserNote'}):
        note_data = {
            'noteid': str(note_obj['_id']),
            'imgid': note_obj['ViewerRecords'][0]['Image']['_id'],
            'imgdb': note_obj['ViewerRecords'][0]['Image']['database'],
            'title': note_obj['Title']
        }
        note_array.append(note_data)

    data = {'notes': note_array}
    return render_template('notes.html', data=data)
