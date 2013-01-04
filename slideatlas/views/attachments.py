
from flask import Blueprint, Response, abort, request, session, flash, redirect, send_file, current_app
from slideatlas import slconn as conn
from bson import ObjectId
from slideatlas import model
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
    db = request.args.get('sessdb', None)
    attachid = request.args.get('attachid', None)
    sessid = request.args.get('sessid', None)
    cmd = request.args.get('cmd', "get")

    if cmd == "get":
        if(db == None or attachid == None or sessid == None):
            flash('sessdb, attachid and sessid must all be set', "error")
            return redirect('/home')
            pass

    # TODO: Can we store this information in the session information (or a database information)
    conn.register([model.Database])
    admindb = conn["slideatlasv2"]
    try:
        dbid = ObjectId(db)
    except:
            flash('dbid is not a valid id', "error")
            return redirect('/home')

    dbobj = admindb["databases"].find_one({"_id" : dbid})
    db = conn[dbobj['dbname']]

    if not model.VerifySessionAccess(model.SEE_SESSION, db, sessid):
            flash('Forbidden Access ', "error")
            return redirect('/home')

#    try:
    gf = gridfs.GridFS(db , "attachments")
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
