from flask import Blueprint, request, render_template, session, redirect, flash, url_for, jsonify
from slideatlas.model import Image, Session, Rule, User, Database
from bson.objectid import ObjectId
from slideatlas.connections import slconn as conn

from gridfs import GridFS
from bson import ObjectId

NUMBER_ON_PAGE = 10


mod = Blueprint('session', __name__)

@mod.route('/sessions')
def sessions():
    """
    - /sessions  With no argument displays list of sessions accessible to current user
    - /sessions?sess=10239094124  searches for the session id
    """
    rules = []

    # Compile the rules 
    conn.register([Image, Session, User, Rule, Database])
    admindb = conn["slideatlasv2"]

    # Assert the user is logged in
    if 'user' in session:
        name = session['user']['label']
        id = session['user']['id']


        userobj = admindb["users"].User.fetch_one({"_id":  ObjectId(id)})

#        #db.sessions.find({}, {) // skip 20, limit 10
#        coll = db["sessions"]
#        asession = coll.find_one({'_id' : ObjectId(sessid)} , {'images':{ '$slice' : [next, NUMBER_ON_PAGE] }, '_id' : 0})

    else:
        # Send the user back to login page
        # with some message
        flash("You must be logged in to see that resource", "error")
        return redirect(url_for('login.login'))


    # This code gets executed only if the user information is available
    # See if the user is requesting any session id
    sessid = request.args.get('sessid', None)
    ajax = request.args.get('ajax', None)
    next = int(request.args.get('next', 0))

    if sessid:
        # Find and return a single session
        # Make sure user has access to that session

        #db.sessions.find({}, {) // skip 20, limit 10
        db = conn["bev1"]
        coll = db["sessions"]
        asession = coll.find_one({'_id' : ObjectId(sessid)} , {'images':{ '$slice' : [next, NUMBER_ON_PAGE] }, '_id' : 0})

        # iterate through the session objects
        images = {}

        if asession.has_key("views"):
            for aview in asession['views']:
                viewobj = db["views"].find_one({"_id" : aview["ref"]})
                imgobj = db["images"].find_one({'_id' : ObjectId(viewobj["img"])}, {'_id' : 0})
                if imgobj.has_key("thumb"):
                    del imgobj['thumb']

                images[str(viewobj["img"])] = imgobj
                # Delete thumbnail if present

        for animageid in images.keys():
            print images[animageid]['label']

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
        # Compile a list of session names / ids
        sessionlist = []

        # From rules pertaining to current user 
        for arule in userobj["rules"]:
            rule = {}
            ruleobj = admindb["rules"].Rule.find_one({"_id" : arule})
            #flash(str(ruleobj), 'success')
            rule["rule"] = ruleobj["label"]

            # Find the db pertaining to this rule 
            dbobj = admindb["databases"].Database.find_one({"_id" : ruleobj["db"]})

            # TODO: initiate new connection if required with this database
            db = conn[dbobj["dbname"]]
            sessions = []

            if 'can_see_all' in ruleobj and ruleobj["can_see_all"] == True:
                flash("All" + ruleobj["label"], "success")
                # Gets access to see / admin all sessions in this DB
                for sessionobj in db["sessions"].Session.find():
                    thissession = {'sessid' : str(sessionobj["_id"]),
                                            'label' : sessionobj["label"]
                                            }
                    sessions.append(thissession)
            elif len(ruleobj["can_see"]) > 0:
                # Gets access to a limited number of sessions
                for asession in ruleobj["can_see"]:
                    sessionobj = db["sessions"].Session.find_one({"_id" : asession})
                    thissession = {'sessid' : str(sessionobj["_id"]),
                                            'label' : sessionobj["label"]
                                            }
                    sessions.append(thissession)
            rule["sessions"] = sessions

            # if db administrator
            if 'db_admin' in ruleobj and ruleobj["db_admin"] == True:
                # Update the administrative 
                pass

            sessionlist.append(rule)

#        sessionlist.append({'rule':'Rule1 label',
#            'sessions' :[
#                                { 'sessid' : 1234,
#                                  'label' : 'Sessions1 label',
#                                  'images' : False },
#
#                                { 'sessid' : 1234,
#                                  'label' : 'Sessions2 label',
#                                  'canadmin' : True},
#                                  ]
#            })
#        # Array of dictionaries
#
#        sessionlist.append({'rule':'Rule2 label',
#            'sessions' :[
#                                { 'sessid' : 1234,
#                                  'label' : 'Rule2 Sessions1 label',
#                                  'images' : True },
#
#                                { 'sessid' : 1234,
#                                  'label' : 'Rule 2 Sessions2 label',
#                                  'canadmin' : False},
#                                  ]
#            })

        return render_template('sessionlist.html', sessions=sessionlist, name=name)
