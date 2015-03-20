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

import pymongo
NUMBER_ON_PAGE = 10

mod = Blueprint('search', __name__)


################################################################################
@mod.route('/search')
def search_view():
    """
    Entry point into angularjs app for interactive search results
    """
    return render_template('search.html')


################################################################################
@mod.route('/query')
def query_json_endpoint():
    """
    /query?include=views&words=[]

    accepts two parameters
    """
    terms = request.args.get("terms", "")

    words = terms.split(" ")

    resobj = {}
    resobj["terms"] = words

    # Filter for only viewable views
    col_view = models.View._get_collection()
    col_view.ensure_index([("Title","text"),("Text", "text")], name="titletext")
    selected_views = col_view.find(
        {'$text': {"$search": terms}},
        {'score': {"$meta": "textScore"}, "Title" : 1, "Text" : 1});

    # Sort according to score
    selected_views.sort([('score', {'$meta': 'textScore'})])

    selected_views = dict((str(aview["_id"]), aview) for aview in selected_views)

    # resobj["selected_views"] = selected_views
    # return jsonify(resobj)

    selected_ids = set(selected_views.keys())
    accessible_ids = set()

    # Only care only about views
    all_sessions_query = models.Session.objects\
        .only('collection', 'label', 'image_store', 'type', 'views')\
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

    # filter each session
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

    ajax_session_list = []

    # Compose the view tree
    # Filter the view tree for selected views
    # Filter the list of views for views that have no access
    for collection, can_admin, sessions in all_sessions:
        acollection ={
            'rule': collection.label,
            'can_admin': can_admin,
            'sessions': [],
            'isOpen': True
        }
        atleast_one = False
        for session, can_admin in sessions:
            # Get views that have access in this session
            accessible_ids |= set([str(aview) for aview in session.views])
            asession = {
                        'sessdb': str(session.image_store.id),
                        'sessid': str(session.id),
                        'label': session.label,
                        'views': filter(lambda x:str(x) in selected_ids, session.views),
                        'isOpen' :True

                    }

            if len(asession["views"]) > 0:
                atleast_one = True
                acollection["sessions"].append(asession)

        if atleast_one:
            ajax_session_list.append(acollection)

    resobj["selected_and_accessible_views_in_collections"] = ajax_session_list
    resobj["selected_and_accessible_views"] = { selected_id: selected_views[selected_id] for selected_id in set(selected_ids) & set(accessible_ids)}

    # resobj["selected_ids"] = list(selected_ids)
    # resobj["accessible_ids"] = list(accessible_ids)

    resobj["stats"] = {
        "selected_views": len(selected_views),
        "selected_and_accessible_views" : len(resobj["selected_and_accessible_views"]),
        "accessible_views": len(accessible_ids),
        "all_views": col_view.find().count()
        }
    return jsonify(resobj)


