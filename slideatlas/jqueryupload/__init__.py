# Expects base.html available to extend from 

from flask import Blueprint, Response, abort, request, session, render_template, current_app

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
    return render_template("upload.html")
