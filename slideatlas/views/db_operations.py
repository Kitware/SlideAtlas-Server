from flask import Blueprint, jsonify, request
import json
from bson import ObjectId
mod = Blueprint('db_operations', __name__)
from slideatlas import models


@mod.route('/modify')
def modify():
    """
    Locates a record based on ID and modifies a particular field to new value
    """
    # Get the parameters
    id = request.args.get('_id')
    collection = request.args.get('collection')
    fields = json.loads(request.args.get('fields', "{}"))
    db = request.args.get('db')

    # If not enough information return error
    if not (id and collection and db):
        data = {"error" : 1, "message" : "_id, collection and database are all required"}
        return jsonify(data)

    database = models.ImageStore.objects.get_or_404(id=db)

    # TODO: Make sure that the caller has access rights for modification

    col = database.to_pymongo()[collection]
    rec = col.find_one({ "_id" : ObjectId(id) })
    if rec == None:
        data = {"error" : 1, "message" : "Unable to locate record"}
        return jsonify(data)

    for akey in fields:
        if akey in rec:
            col.update({"_id" : rec["_id"]}, { "$set" : { akey : fields[akey] } })

    # Make sure the obtained record has the field we want to modify and validate
    data = {'success': 1, 'id' : id, 'fields' : fields}
    return jsonify(data)

def fix():
    """
    For procedural commands processing over sessions or images or etc
    """
    pass
