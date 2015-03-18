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
    includes = []
    words = terms.split(" ")

    resobj = {}
    resobj["terms"] = words
    resobj["results"] = []

    return jsonify(resobj)
