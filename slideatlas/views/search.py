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
    selected_views = col_view.find({'$text': {"$search": terms}}, {"Title" : 1, "Text" : 1});
    resobj["results"] = [aview for aview in selected_views]

    return jsonify(resobj)

    # # Only care only about views
    # all_sessions_query = models.Session.objects\
    #     .only('collection', 'label', 'image_store', 'type')\
    #     .order_by('collection', 'label')\
    #     .no_dereference()
    # # disable dereferencing of of sessions, to prevent running a seperate
    # #   query for every single session's collection
    # all_collections_query = models.Collection.objects\
    #     .no_dereference()

    # can_admin_collection_ids = [collection.id for collection in all_collections_query.can_access(g.identity.provides , models.Operation.admin)]

    # editable_sessions_query = all_sessions_query.can_access(g.identity.provides, models.Operation.edit)
    # viewable_sessions_query = all_sessions_query.can_access(g.identity.provides, models.Operation.view, strict_operation=True)

    # # fetch the relevant collections in bulk
    # collections_by_id = {collection.id: collection for collection in
    #                      chain(editable_sessions_query.distinct('collection'),
    #                            viewable_sessions_query.distinct('collection')
    #                      )}

    # all_sessions = defaultdict(dict)
    # for sessions_query, can_admin in [
    #     # viewable must come first, so editable can overwrite
    #     (viewable_sessions_query, False),
    #     (editable_sessions_query, True),
    #     ]:
    #     for collection_ref, sessions in groupby(sessions_query, attrgetter('collection')):
    #         collection = collections_by_id[collection_ref.id]
    #         all_sessions[collection].update(dict.fromkeys(sessions, can_admin))

    # all_sessions = [(collection,
    #                 True if collection.id in can_admin_collection_ids else False,
    #                 sorted(sessions_dict.iteritems(), key=lambda item: item[0].label)
    #                 )
    #                 for collection, sessions_dict
    #                 in sorted(all_sessions.iteritems(), key=lambda item: item[0].label)]

    # # Whether to include administrative javascript
    # is_admin = bool(len(can_admin_collection_ids))

    # if request.args.get('json'):
    #     ajax_session_list = [
    #         {
    #             'rule': collection.label,
    #             'can_admin': can_admin,
    #             'sessions': [
    #                 {
    #                     'sessdb': str(session.image_store.id),
    #                     'sessid': str(session.id),
    #                     'label': session.label
    #                 }
    #                 for session, can_admin in sessions],
    #         }
    #         for collection, can_admin, sessions in all_sessions]
    #     user_name = security.current_user.full_name if security.current_user.is_authenticated() else 'Guest'
    #     return jsonify(sessions=ajax_session_list, name=user_name, ajax=1)
    # else:
    #     return render_template('sessionlist.html', all_sessions=all_sessions, is_admin=is_admin)


    # return jsonify(resobj)


