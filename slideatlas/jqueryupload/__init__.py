# Expects base.html available to extend from 

from flask import Blueprint, Response, abort, request, session, render_template, current_app, jsonify
from werkzeug import secure_filename
import os

mod = Blueprint('upload', __name__,
                template_folder="templates",
                static_folder="static",
                url_prefix="/jqueryupload"
                )

@mod.route('/upload', methods=["GET", "POST"])
def upload():
    """
    - /tile/4e695114587718175c000006/t.jpg  searches and returns the image
    """
    if request.method == 'POST':
        # we are expected to save the uploaded file and return some infos about it:
        #                              vvvvvvvvv   this is the name for input type=file
        names = []

        for file in request.files.getlist('files[]'):
            filename = secure_filename(file.filename)
            print filename
            file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
            names.append({"name" : filename})


        return render_template("list.html", names=names)


    return render_template("upload.html")
