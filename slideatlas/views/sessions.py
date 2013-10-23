from flask import Blueprint, request, render_template, session, redirect, flash, url_for, current_app
from slideatlas.model import Image, Session, Rule, User, Database
from bson.objectid import ObjectId
from slideatlas import slconn as conn
from slideatlas.common_utils import jsonify

from gridfs import GridFS
from bson import ObjectId

import json
import pdb

NUMBER_ON_PAGE = 10


mod = Blueprint('session', __name__)

@mod.route('/sessions')
def sessions():
    """
    - /sessions  With no argument displays list of sessions accessible to current user
    - /sessions?sessid=10239094124  searches for the session id
    """
    rules = []

    # Compile the rules
    conn.register([Image, Session, User, Rule, Database])
    admindb = conn[current_app.config["CONFIGDB"]]


    # Assert the user is logged in
    if 'user' in session:
        name = session['user']['label']
        id = session['user']['id']
        userobj = admindb["users"].User.find_one({"_id":  ObjectId(id)})
        if userobj == None:
            # If the user is not found then something wrong 
            # Redirect the user to home with error message 
            flash("Invalid login", "error")
            return redirect(url_for('login.login'))

    else:
        # Send the user back to login page
        # with some message
        flash("You must be logged in to see that resource", "error")
        return redirect(url_for('login.login'))


    # This code gets executed only if the user information is available
    # See if the user is requesting any session id
    sessid = request.args.get('sessid', None)
    sessdb = request.args.get('sessdb', None)
    ajax = request.args.get('json', None)
    next = int(request.args.get('next', 0))

    if sessid and sessdb:
        # Find and return image list from single session
        # TODO: Refactor this into a function 
        access = False
        dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(sessdb) })

        #TODO: make sure the connection to host is available
        db = conn[dbobj["dbname"]]

        # From rules pertaining to current user
        try:
            for arule in userobj["rules"]:
                ruleobj = admindb["rules"].Rule.find_one({"_id" : arule})
                if str(ruleobj["db"]) == sessdb:
                        if 'db_admin' in ruleobj and ruleobj["db_admin"] == True:
                            access = True
                        elif 'can_see_all' in ruleobj and ruleobj["can_see_all"] == True:
                            access = True
                        elif len(ruleobj["can_see"]) > 0:
                            for asession in ruleobj["can_see"]:
                                if str(asession) == sessid:
                                    access = True
        except:
            pass
        # Confirm that the user has access
        if access == False :
            flash("Unauthorized access", "error")
            return redirect("/home")

        coll = db["sessions"]
        asession = coll.find_one({'_id' : ObjectId(sessid)} , {'images':{ '$slice' : [next, NUMBER_ON_PAGE] }, '_id' : 0})

        # iterate through the session objects
        images = []
        if asession.has_key("views"):        
            for aview in asession['views']:
                hide = False
                if 'hide' in aview :
                  if aview["hide"] :
                    hide = True
                viewobj = db["views"].find_one({"_id" : aview["ref"]})
                # Crash here. Session had a viewid that did not exist.
                # Should we clean up the broken reference? Just skip for now.
                if viewobj :
                    imgdb = sessdb
                    imgid = 0
                    label = ""
                    if "Type" in viewobj:
                      if viewobj["Type"] == "Note" :
                        imgid = viewobj["ViewerRecords"][0]["Image"]
                        imgdb = viewobj["ViewerRecords"][0]["Database"]
                        label = viewobj["Title"]
                    if imgid == 0 :
                        imgid = str(viewobj["img"])
                    if "imgdb" in viewobj :
                      imgdb = viewobj["imgdb"]
                    if imgdb == sessdb :
                      imgobj = db["images"].find_one({'_id' : ObjectId(imgid)}, {'_id' : 0})
                    else :
                      dbobj2 = admindb["databases"].Database.find_one({ "_id" : ObjectId(imgdb) })
                      #TODO: make sure the connection to host is available
                      db2 = conn[dbobj2["dbname"]]
                      imgobj = db2["images"].find_one({'_id' : ObjectId(imgid)}, {'_id' : 0})
                    if 'hide' in imgobj :
                      if imgobj["hide"] :
                        hide = True
                    if 'hide' in viewobj :
                      if viewobj["hide"] :
                        hide = True
                    if not hide :
                      if label == "" :
                        label = imgobj["label"]
                      if "label" in aview :
                        label = aview["label"]
                      if imgobj.has_key("thumb"):
                          del imgobj['thumb']
                      animage = {}
                      animage['db'] = imgdb
                      animage["img"] = imgid
                      animage["label"] = label
                      animage["view"] = str(aview["ref"])
                      if "type" in viewobj:
                          if viewobj["type"] == "comparison":
                              animage["comparison"] = 1

                      images.append(animage)

#        for animageid in images.keys():
#            print images[animageid]['label']

        attachments = []
        if asession.has_key("attachments"):
            gfs = GridFS(db, "attachments")
            for anattach in asession['attachments']:
                fileobj = gfs.get(anattach["ref"])
                attachments.append({'name': fileobj.name, 'id' : anattach["ref"]})
            del asession["attachments"]

        if 'images' in asession:
            del asession["images"]

        data = {
                 'success': 1,
                 'session' : asession,
                 'images' : images,
                 'attachments' :attachments,
                 'db' : sessdb,
                 'sessid' : sessid,
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
        if "rules" in userobj:
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
                    #flash("All" + ruleobj["label"], "success")
                    # Gets access to see / admin all sessions in this DB
                    for sessionobj in db["sessions"].Session.find():
                        thissession = {'sessid' : str(sessionobj["_id"]),
                                                'label' : sessionobj["label"],
                                                'sessdb': str(dbobj["_id"])
                                                }
                        if 'type' in sessionobj:
                            if (sessionobj["type"] == "stack"):
                                thissession["stack"] = True;
                        sessions.append(thissession)
                elif len(ruleobj["can_see"]) > 0:
                    # Gets access to a limited number of sessions
                    for asession in ruleobj["can_see"]:
                        sessionobj = db["sessions"].Session.find_one({"_id" : asession})
                        if sessionobj == None:
                            continue
                        thissession = {'sessid' : str(sessionobj["_id"]),
                                                'label' : sessionobj["label"],
                                                'sessdb': str(dbobj["_id"])
                                                }
                        if 'type' in sessionobj:
                            if (sessionobj["type"] == "stack"):
                                thissession["stack"] = True;
                        sessions.append(thissession)

                # if db administrator
                if 'db_admin' in ruleobj and ruleobj["db_admin"] == True:
                    # Update the administrative
                    for asession in sessions:
                        #flash("Admin session: " + asession["label"] , "success")
                        asession["canadmin"] = True

                rule["sessions"] = sessions
                sessionlist.append(rule)
            # End of for loop over rules

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
        if ajax:
            return jsonify(sessions=sessionlist, name=name, ajax=1)
        else:
            return render_template('sessionlist.html', sessions=sessionlist, name=name)





# change the order of views in the
@mod.route('/sessionedit')
def sessionedit():
    """
    - /session-edit?sessid=10239094124
    """
    # See if the user is requesting any session id
    sessid = request.args.get('sessid', None)
    sessdb = request.args.get('sessdb', None)

    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(sessdb) })
    db = conn[dbobj["dbname"]]

    session = db["sessions"].find_one({"_id" : ObjectId(sessid) })

    # iterate through the view objects and record image information.
    list = []
    if session.has_key("views"):
        for aview in session['views']:
            view = db["views"].find_one({"_id" : aview["ref"]})
            # missing view ????
            if view :
              label = ""
              imgdb = sessdb
              if "imgdb" in view :
                imgdb = view["imgdb"]
              if "img" in view :
                imgid = view["img"]
              else :
                # an assumption that view is of type note.
                imgid = view["ViewerRecords"][0]["Image"]
                imgdb = view["ViewerRecords"][0]["Database"]
              if "Title" in view :
                label = view["Title"]

              # support for images from different database than the session.
              if imgdb == sessdb :
                image = db["images"].find_one({'_id' : ObjectId(imgid)})
              else :
                dbobj2 = admindb["databases"].Database.find_one({ "_id" : ObjectId(imgdb) })
                db2 = conn[dbobj2["dbname"]]
                image = db2["images"].find_one({'_id' : ObjectId(imgid)})

              if "label" in image :
                label = image["label"]
                
              # thumb should be stored with the tiles, not in the image meta data.
              if image.has_key("thumb"):
                  del image['thumb']
                  db["images"].save(image)

              item = {}
              item['db'] = str(dbobj["_id"])
              item['session'] = sessid;
              item["img"] = str(imgid)
              item["label"] = label
              item["view"] = str(aview["ref"])
              list.append(item)    
    
    data = {
             'success': 1,
             'db' : sessdb,
             'sessid' : sessid,
             'session' : session,
             'list' : list
             }

    return render_template('sessionedit.html', data=data)

    


    
# Saves comparison view back into the database.
@mod.route('/session-save', methods=['GET', 'POST'])
def sessionsave():
    inputStr = request.form['input']  # for post
    #inputStr = request.args.get('input', "{}") # for get

    inputObj = json.loads(inputStr)
    newFlag = inputObj["new"]
    dbId = inputObj["db"]
    sessId = inputObj["session"]
    label = inputObj["label"]
    views = inputObj["views"]
    
    admindb = conn[current_app.config["CONFIGDB"]]
    dbobj = admindb["databases"].Database.find_one({ "_id" : ObjectId(dbId) })
    db = conn[dbobj["dbname"]]

    if 'user' in session:
      email = session["user"]["email"]
      
    #pdb.set_trace()
    admin = False
    if email == "all_bev1_admin" :
      admin = True
    if email == "all_paul3_admin" :
      admin = True
    if not admin :
      return ""

    # get the session in the database to modify.
    # Todo: if session is undefined, create a new session (copy views when available).
    sessObj = db["sessions"].find_one({"_id" : ObjectId(sessId) })
    sessObj["label"] = label
    sessObj["name"] = label # Why a name and label?
    
    # create a new list of sessions.
    oldViews = sessObj["views"]
    newViews = []
    newImages = []
    for viewData in views:
      viewId = None
      if "view" in viewData :
        viewId = viewData["view"]
      # Look for matching old views in new session
      found = False
      for index, view in enumerate(oldViews):
        if str(view["ref"]) == viewId :
          # found one.  Copy it over.
          found = True
          view["pos"] = len(newViews)
          view["label"] = viewData["label"]
          # switch over to the new list.
          newViews.append(view)
          del oldViews[index]
          # What a pain.  Why two lists?  Deal with the image list.
          image = {}
          image["pos"] = len(newImages)
          image["hide"] = False
          viewObj = db["views"].find_one({"_id" : ObjectId(viewId) })
          # if copying a session, copy the view objects too.
          if newFlag :
            del viewObj["_id"]
            view["ref"] = db["views"].save(viewObj);
          if "img" in viewObj :
            image["ref"] = viewObj["img"]
          else :
            # assume view has type note.
            image["ref"] = viewObj["ViewerRecords"][0]["Image"]
          newImages.append(image)
      if not found :
        if not viewId :
          # create a minimal new view (to be stored in db["views"]).
          viewObj = {}
          viewObj["img"] = viewData["img"]
          if viewData["db"] != dbId :
            viewObj["imgdb"] = viewData["db"]
          viewObj["label"] = viewData["label"]
          viewId = db["views"].save(viewObj)
          # make a view entry on the session list
          view = {}
          view["pos"] = len(newViews)
          view["ref"] = viewId
          view["hide"] = False
          view["label"] = viewData["label"]
          newViews.append(view)
          # image
          image = {}
          image["pos"] = len(newImages)
          image["hide"] = False
          image["ref"] = ObjectId(viewData["img"])
          if viewData["db"] != dbId :
            image["db"] = viewData["db"]
          newImages.append(image)          
        #else :
          # Todo: If viewId, copy view from another session.
          
    # Delete the views that are left over.
    # Views are owned by the session.
    # Images can be shared.
    if not newFlag :
      for view in oldViews:
        db["views"].remove({"_id" : view["ref"] })

    sessObj["views"] = newViews;
    sessObj["images"] = newImages;

    #pdb.set_trace()
    if newFlag :
      del sessObj["_id"]
      sessObj["user"] = email;
      sessid = db["sessions"].save(sessObj);    
    elif len(newViews) == 0 :
      db["sessions"].remove({"_id":sessObj["_id"]});
      sessid = "";
    else :
      sessid = db["sessions"].save(sessObj);

    return str(sessid);

