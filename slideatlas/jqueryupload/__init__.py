# Expects base.html available to extend from 

from flask import Blueprint, Response, abort, request, session, render_template, current_app
from werkzeug import secure_filename
from bson.objectid import ObjectId
from slideatlas.common_utils import jsonify
import os
import re

mod = Blueprint('upload', __name__,
                template_folder="templates",
                static_folder="static",
                url_prefix="/upload"
                )

@mod.route('', methods=["GET", "POST", "PUT"])
def upload():
    """
    Assumes that a chunked upload is provided 
    A unique gridfs id is created upon first chunk and later   
    """
    if request.method == 'POST':
        # TODO: Get the new method in paramters 
        # Verfiy that the uploader has access 
        id = ObjectId()
        form = request.form
        # No need to return conventional file list 
        jsonresponse = {}
        jsonresponse["_id"] = id
        return jsonify(jsonresponse)

    if request.method == 'PUT':
        # we are expected to save the uploaded file and return some info about it:
        # this is the name for input type=file
        names = []
        # Make sure to read the form before sending the reply
        # Parse headers 
        #Get filename from content disposition 
        fnameheader = request.headers["Content-Disposition"]
        disposition = re.search(r'filename="(.+?)"', fnameheader)
        filename = disposition.group(0)[10:-1]

        # Get the actual chunk position from Content-Range
        range = request.headers["Content-Range"]
        match = re.findall(r'\d+', range)
        start = int(match[0])
        end = int(match[1])
        total = int(match[2])

        # No need to return conventional file list 
        jsonresponse = {}

        # Expect _id in the form
        try:
            id = request.form['_id']
        except:
            return Response("{\"error\" : \" each put request must include _id requested from server \"}", status=400)

        # Craft the response json 
        jsonresponse["done"] = end + 1
        jsonresponse["_id"] = id

        return jsonify(jsonresponse)
#        print request.headers



        # Now create the file being uploaded or append etc

        # TODO: Decide the format to return  
        #        obj = {}
        #        obj["boundary"] = request.headers["Content-Type"]
        #        obj["size"] = False
        #        obj["delete_type"] = "DELETE"
        #        obj["delete_url"] = "?file=" + filename
        #        obj["name"] = filename
        #        print obj

        return jsonify(obj)

        for file in request.files.getlist('files[]'):
            filename = secure_filename(file.filename)
            print filename
            file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
            names.append({"name" : filename})


        return render_template("list.html", names=names)


    return render_template("upload.html")
