from flask import Blueprint, request, render_template, session, redirect, flash, url_for, jsonify
from slideatlas.model import Image, Session
from bson.objectid import ObjectId
from slideatlas.connections import slconn as conn

from gridfs import GridFS

NUMBER_ON_PAGE = 10


mod = Blueprint('session', __name__)

@mod.route('/sessions')
def sessions():
    """
    - /sessions  With no argument displays list of sessions accessible to current user
    - /sessions?sess=10239094124  searches for the session id
    """
    # Assert the user is logged in
    if 'user' in session:
        name = session['user']['label']
    else:
        # Send the user back to login page
        # with some message
        flash("You must be logged in to see that resource", "error")
        return redirect(url_for('login.login'))

    # See if the user is requesting any session id
    sessid = request.args.get('sessid', None)
    ajax = request.args.get('ajax', None)
    next = int(request.args.get('next', 0))


    if sessid:
        # Find and return a single session
        print sessid

        conn.register([Image, Session])

        #db.sessions.find({}, {) // skip 20, limit 10
        db = conn["bev1"]
        coll = db["sessions"]
        asession = coll.find_one({'_id' : ObjectId(sessid)} , {'images':{ '$slice' : [next, NUMBER_ON_PAGE] }, '_id' : 0})

        # iterate through the session objects
        images = []

        for animage in asession['images']:
            images.append(db["images"].find_one({'_id' : ObjectId(animage["ref"])}, {'_id' : 0}))
            images[-1]['id'] = str(animage["ref"])
            del images[-1]['thumb']

        print images

        attachments = []
        if asession.has_key("attachments"):
            gfs = GridFS(db, "attachments")
            for anattach in asession['attachments']:
                fileobj = gfs.get(anattach["ref"])
                attachments.append({'name': fileobj.name})
            del asession["attachments"]

        del asession["images"]

        data = {
                 'success': 1,
                 'session' : asession,
                 'images' : images,
                 'attachments' :attachments,
                 'next' : url_for('session.sessions', sessid=sessid, ajax=1, next=next + NUMBER_ON_PAGE)
                 }

        if ajax:
            return jsonify(data)
        else:
            return render_template('session.html', data=data, name=name)

    else:
        # Find and return a list of session names / ids
        sessionlist = []

        sessionlist.append({'rule':'Rule1 label',
            'sessions' :[
                                { 'sessid' : 1234,
                                  'label' : 'Sessions1 label',
                                  'images' : False },

                                { 'sessid' : 1234,
                                  'label' : 'Sessions2 label',
                                  'canadmin' : True},
                                  ]
            })
        # Array of dictionaries

        sessionlist.append({'rule':'Rule2 label',
            'sessions' :[
                                { 'sessid' : 1234,
                                  'label' : 'Rule2 Sessions1 label',
                                  'images' : True },

                                { 'sessid' : 1234,
                                  'label' : 'Rule 2 Sessions2 label',
                                  'canadmin' : False},
                                  ]
            })

        return render_template('sessionlist.html', sessions=sessionlist, name=name)
