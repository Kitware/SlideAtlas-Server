
from flask import Blueprint, Response, abort, request, session, flash, redirect
from slideatlas.connections import slconn as conn
from bson import ObjectId
from slideatlas import model

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

    flash('So far so good ', "success")
    return redirect("/home")

