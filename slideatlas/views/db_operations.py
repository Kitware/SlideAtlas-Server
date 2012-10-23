from flask import Blueprint, Response, abort, jsonify, request
from slideatlas.connections import slconn as conn
import mongokit
import json
from bson import ObjectId
mod = Blueprint('db_operations', __name__)
from slideatlas.model import Image

@mod.route('/modify')
def modify():
    """
    Locates a record based on ID and modifies a particular field to new value 
    """
    # Get the parameters 
    id = request.args.get('_id', None)
    collection = request.args.get('collection', None)
    fields = json.loads(request.args.get('fields', "{}"))

    # If not enough information return error
    if id == None or collection == None :
        data = {"error" : 1, "message" : "id and collection both required"}
        return jsonify(data)

    try :
        col = conn["bev1"][collection]
        rec = col.Image.one({"_id" : ObjectId(id)})
        if rec == None:
            raise 1
    except :
        data = {"error" : 1, "message" : "Unable to locate record"}
        return jsonify(data)

    # Make sure the obtained record has the field we want to modify and validate
    print "yay"
    data = fields
    return jsonify(data)

