
from flask import Blueprint, request, flash, redirect, current_app
from bson import ObjectId
from slideatlas import models
from werkzeug.wsgi import wrap_file
import gridfs
mod = Blueprint('attachment', __name__)

@mod.route('/attachment')
def attachments():
    """
    Interface for managing attachments
    first step is to download attachments
    Just knowing attachid is not enough. It should belong to the session one has access to
    - /tile/4e695114587718175c000006/t.jpg  searches and returns the image
    """
    # Get variables
    db = request.args.get('sessdb')
    attachid = request.args.get('attachid')
    sessid = request.args.get('sessid')
    cmd = request.args.get('cmd', "get")

    if cmd == "get":
        if not(db and attachid and sessid ):
            flash('sessdb, attachid and sessid must all be set', "error")
            return redirect('/home')

    try:
        dbid = ObjectId(db)
        database = models.Database.objects.get(id=dbid)
    except:
        flash('dbid is not a valid id', "error")
        return redirect('/home')

#    try:
    gf = gridfs.GridFS(database.to_pymongo(raw_object=True) , "attachments")
    fileobj = gf.get(ObjectId(attachid))
#    except:
#        flash('Error locating file', "error")
#        return redirect('/home')
        # mostly copied from flask/helpers.py, with
        # modifications for GridFS
    data = wrap_file(request.environ, fileobj)
    response = current_app.response_class(
        data,
        mimetype=fileobj.content_type,
        direct_passthrough=True)
    response.content_length = fileobj.length
    response.last_modified = fileobj.upload_date
    response.set_etag(fileobj.md5)
    response.cache_control.max_age = 0
    response.cache_control.s_max_age = 0
    response.cache_control.public = True
    response.headers['Content-Disposition'] = 'attachment; filename=' + fileobj.filename
    response.make_conditional(request)
    return response
