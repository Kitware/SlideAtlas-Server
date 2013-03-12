"""
rest api for administrative interface
refer to documentation
"""
from werkzeug.wsgi import wrap_file
from flask import Blueprint, render_template, request, url_for, current_app, Response, abort
from flask.views import MethodView
from bson import ObjectId
from slideatlas import slconn as conn
from slideatlas import admindb
from slideatlas import model
from celery.platforms import resource
from slideatlas.common_utils import jsonify
from slideatlas.model.database import Database
from slideatlas.model import Session
from gridfs import GridFS
from slideatlas.common_utils import site_admin_required
from slideatlas.common_utils import user_required
import re
import gridfs

from json import dumps
from bson.binary import Binary
mod = Blueprint('api', __name__,
                url_prefix="/apiv1",
                template_folder="templates",
                static_folder="static",
                )

# The url valid for databases, rules and users with supported queries
class AdminDBAPI(MethodView):
    decorators = []

    @site_admin_required(False)
    def get(self, restype, resid=None):
        # Restype has to be between allowed ones or the request will not come here
        if resid == None:
            objs = conn[current_app.config["CONFIGDB"]][restype].find()
            objarray = list()
            for anobj in objs:
                # Filter the list with passwd if type is user
                if restype == "users":
                    if "passwd" in anobj:
                        del anobj["passwd"]
                objarray.append(anobj)
            return jsonify({ restype : objarray})
        else:
            obj = conn[current_app.config["CONFIGDB"]][restype].find_one({"_id" : ObjectId(resid)})
            if obj :
                if restype == "users":
                    if "passwd" in obj:
                        del obj["passwd"]

                return jsonify(obj)
            else:
                return Response("{\"error\" : \"resource not found\"}" , status=405)

    def post(self, restype):
        # create a new user
        if restype == "rules":
                return "You want to post rule"
        elif restype == 'databases':
                return "You want to add database"
        elif restype == 'users':
            # Posting to users means typically adding new rules to users
            return "You want to add database"
        pass

    def delete(self, resid):
        # Verify the access
        # Remove one instance
        # and remove the given resource
        # Not implemented right now
        pass

    def put(self, restype, resid):
        # update some information
        pass

# The url valid for databases, rules and users with supported queries

class DatabaseAPI(AdminDBAPI):

    def delete(self, resid):
        obj = conn[current_app.config["CONFIGDB"]]["databases"].find_one({"_id" : ObjectId(resid)})
        if obj :
            conn[current_app.config["CONFIGDB"]]["databases"].remove({"_id" : obj["_id"]})
            return Response("{}", status=200)
        else:
            # Invalid request if the object is not found
            return Response("{\"error\" : \"Id Not found \"} ", status=405)

    def post(self, resid=None):
        # post requires admin access

        # Parse the data in json format 
        data = request.json

        # Unknown request if no parameters 
        if data == None:
            abort(400)

        conn.register([Database])

        # Only insert command is supported
        if data.has_key("insert") :
            # Create the database object from the supplied parameters  

            try:
                if resid <> None:
                    raise Exception("Trying to create new resource at existing resource")

                newdb = conn[current_app.config["CONFIGDB"]]["databases"].Database()
                newdb["label"] = data["insert"]["label"]
                newdb["host"] = data["insert"]["host"]
                newdb["dbname"] = data["insert"]["dbname"]
                newdb["copyright"] = data["insert"]["copyright"]
                newdb.validate()
                newdb.save()
            except Exception as inst:
                # If valid database object cannot be constructed it is invalid request 
                return Response("{\"error\" : \"%s\"}" % str(inst), status=405)

            return jsonify(newdb)
        elif data.has_key("modify"):
            # Resid must be supplied
            if resid == None :
                return Response("{\"error\" : \"No resource id supplied for modification\"}" , status=405)

            try:
                # Locate the resource 
                newdb = conn[current_app.config["CONFIGDB"]]["databases"].Database.find_one({"_id" : ObjectId(resid)})
                if newdb == None:
                    raise Exception(" Resource %s not found" % (resid))
            except Exception as inst:
                # If valid database object cannot be constructed it is invalid request 
                return Response("{\"error\" : \"%s\"}" % str(inst), status=405)

            # Now update 
            try:
                for akey in data["modify"]:
                    if akey == "_id":
                        return Response("{\"error\" : \"Cannot modify _id \"}" , status=405)

                    # Update other keys
                    if akey in newdb:
                        newdb[akey] = data["modify"][akey]

                    newdb.validate()
                    newdb.save()
            except Exception as inst:
                # If valid database object cannot be constructed it is invalid request 
                return Response("{\"error\" : \"%s\"}" % str(inst), status=405)

            return jsonify(newdb)

        else:
            # Only insert and modify commands supported so far
            abort(400)


    def put(self, resid):
        # put requires admin access

        # Get json supplied 
        data = request.json

        # Check for valid parameters 
        # Check if no parameters 
        if data == None:
            return Response("{\"error\" : \"No parameters ? \"}", status=405)

        # See if id matches the resource being modified
        try:
            if data["_id"] != resid:
                raise Exception(1)
        except:
                return Response("{\"error\" : \"_id mismatch with the location in the url \"}", status=405)

        # Try to see if the data can create valid object 
        conn.register([Database])

        # The object should exist
        dbobj = conn[current_app.config["CONFIGDB"]]["databases"].Database.find_one({"_id" : ObjectId(resid)})

        # Unknown request if no parameters 
        if dbobj == None:
            return Response("{\"error\" : \"Resource _id: %s  doesnot exist\"}" % (resid), status=403)

        # Create the database object from the supplied parameters  
        try:
            dbobj["label"] = data["label"]
            dbobj["host"] = data["host"]
            dbobj["dbname"] = data["dbname"]
            dbobj["copyright"] = data["copyright"]
            dbobj.validate()
            dbobj.save()
        except Exception as inst:
            # If valid database object cannot be constructed it is invalid request 
            return Response("{\"error\" : %s}" % str(inst), status=405)

        return jsonify(dbobj)

mod.add_url_rule('/databases', view_func=DatabaseAPI.as_view("show_database_list"), methods=['post'])
mod.add_url_rule('/databases/<regex("[a-f0-9]{24}"):resid>', view_func=DatabaseAPI.as_view("show_database"), methods=['DELETE', 'put', 'post'])

mod.add_url_rule('/<regex("(databases|users|rules)"):restype>', defaults={"resid" : None}, view_func=AdminDBAPI.as_view("show_resource_list"), methods=['get'])
mod.add_url_rule('/<regex("(databases|users|rules)"):restype>/<regex("[a-f0-9]{24}"):resid>', view_func=AdminDBAPI.as_view("show_resource"))

# The url valid for databases, rules and users with supported queries
class DataSessionsAPI(MethodView):
    decorators = [user_required]
    def get_data_db(self, dbid):
            conn.register([Database])
            admindb = conn[current_app.config["CONFIGDB"]]
            dbobj = admindb["databases"].Database.find_one({'_id' : ObjectId(dbid)})
            if dbobj == None:
                return None
            # TODO: have an application or module level connection pooling
            return conn[dbobj["dbname"]]

    def get(self, dbid, sessid=None):
        conn.register([Session, Database])
        datadb = self.get_data_db(dbid)
        if datadb == None:
            return Response("{ \"error \" : \"Invalid database id %s\"}" % (dbid), status=405)

        if sessid == None:
            sessions = datadb["sessions"].Session.find({}, {'images':0, 'views':0, 'attachments':0})
            sessionlist = list()

            for asession in sessions:
                sessionlist.append(asession)

            if len(sessionlist) > 0:
                return jsonify({'sessions' : sessionlist})
            else:
                return Response("{ \"error \" : \"You want You want a list of sessions in %s, but there are no sessions in it \"}" % (dbid), status=405)
        else:
            # Get and return a list of sessions from given database
            # TODO: Filter for the user that is requesting
            sessobj = datadb["sessions"].find_one({"_id" : ObjectId(sessid)})
            if sessobj == None:
                return Response("{ \"error \" : \"Session %s does not exist in db %s\"}" % (sessid, dbid), status=405)

            # Dereference the views 
            for aview in sessobj["views"]:
                viewdetails = datadb["views"].find_one({"_id" : aview["ref"]})
                viewdetails["image"] = datadb["images"].find_one({"_id" : viewdetails["img"]}, { "thumb" : 0})
                aview["details"] = viewdetails

            # Dereference the attachments
            attachments = []
            if "attachments" in sessobj:
                gfs = GridFS(datadb, "attachments")
                for anattach in sessobj['attachments']:
                    fileobj = gfs.get(anattach["ref"])
                    anattach["details"] = ({'name': fileobj.name, 'length' : fileobj.length})
            else:
                sessobj["attachments"] = []

            return jsonify(sessobj)


    def delete(self, dbid, sessid=None):
        conn.register([Session, Database])
        datadb = self.get_data_db(dbid)
        if datadb == None:
            return Response("{ \"error \" : \"Invalid database id %s\"}" % (dbid), status=405)

        if sessid == None:
            return Response("{ \"error \" : \"No session to delete\"}", status=405)
        else:
            # TODO: Important, Not all users are allowed to delete
            sessobj = datadb["sessions"].find_one({"_id" : ObjectId(sessid)})

            if sessobj <> None:
                # Delete if empty
                empty = True

                if "images" in sessobj:
                    if len(sessobj["images"]) > 0:
                        empty = False

                if "attachments" in sessobj:
                    if len(sessobj["attachments"]) > 0:
                        empty = False

                if "attachments" in sessobj:
                    if len(sessobj["attachments"]) > 0:
                        empty = False

                if not empty:
                    return Response("{ \"error \" : \"Session %s in db %s not empty\"}" % (sessid, dbid), status=405)
                else:
                    # Perform the delete
                    try:
                        datadb["sessions"].remove({"_id" : ObjectId(sessid)})
                        print "DELETED from application"
                    except Exception as inst:
                        return Response("{\"error\" : %s}" % str(inst), status=405)
                    # TODO: How to return success?
                    return Response("{}")
            else:
                return Response("{ \"error \" : \"Session %s does not exist in db %s\"}" % (sessid, dbid), status=405)

    def post(self, dbid, sessid=None):
        # Parse the data in json format 
        data = request.json

        # Unknown request if no parameters 
        if data == None:
            abort(400)

        conn.register([Session])
        db = self.get_data_db(dbid)
        if data.has_key("insert"):
            # Create the database object from the supplied parameters
            try:
                newsession = db["sessions"].Session()
                newsession["label"] = data["insert"]["label"]
                newsession["images"] = []
                newsession.validate()
                newsession.save()
            except Exception as inst:
    #            # If valid database object cannot be constructed it is invalid request 
                return Response("{\"error\" : %s}" % str(inst), status=405)

            return jsonify(newsession)

        elif data.has_key("modify"):
          # Resid must be supplied
            if sessid == None :
                return Response("{\"error\" : \"No session _id supplied for modification\"}" , status=405)

            try:
                # Locate the resource 
                newdb = db["sessions"].Session.find_one({"_id" : ObjectId(sessid)})
                if newdb == None:
                    raise Exception(" Resource %s not found" % (sessid))
            except Exception as inst:
                # If valid database object cannot be constructed it is invalid request 
                return Response("{\"error\" : \"%s\"}" % str(inst), status=405)

            # Now update 
            try:
                for akey in data["modify"]:
                    # Presently updating only label is supported
                    if akey <> "label":
                        return Response("{\"error\" : \"Cannot modify %s \"}" % (akey) , status=405)

                    newdb[akey] = data["modify"][akey]
                    newdb.validate()
                    newdb.save()
            except Exception as inst:
                # If valid database object cannot be constructed it is invalid request 
                return Response("{\"error\" : \"%s\"}" % str(inst), status=405)

            return jsonify(newdb)

        else:
            # Only insert and modify commands are supported
            abort(400)

class DataSessionItemsAPI(MethodView):
    decorators = [user_required]

    def get_data_db(self, dbid):
            conn.register([Database])
            admindb = conn[current_app.config["CONFIGDB"]]
            dbobj = admindb["databases"].Database.find_one({'_id' : ObjectId(dbid)})
            if dbobj == None:
                return None
            # TODO: have an application or module level connection pooling
            return conn[dbobj["dbname"]]

    def get(self, dbid, sessid, restype, resid=None):
        if resid == None:
            return "You want alist of %s/%s/%s" % (dbid, sessid, restype)
        else:
            datadb = self.get_data_db(dbid)
            if datadb == None:
                return Response("{ \"error \" : \"Invalid database id %s\"}" % (dbid), status=405)

            if restype == "attachments" or restype == "rawfiles":
                gf = gridfs.GridFS(datadb , restype)

                fileobj = gf.get(ObjectId(resid))
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
            else:
                return "You want %s from views in %s/%s" % (resid, dbid, sessid)

    def put(self, dbid, sessid, restype, resid):
        # we are expected to save the uploaded file and return some info about it:
        # this is the name for input type=file
        names = []
        # Make sure to read the form before sending the reply
        # Parse headers 

        try:
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
        except:
            return Response("{\"error\" : \" Error in parsing headers \"}", status=405)

        # No need to return conventional file list 
        jsonresponse = {}
        # Expect _id in the form
        try:
            jsonresponse["_id"] = request.form['_id']
        except:
            return Response("{\"error\" : \" each put request must include _id requested from server \"}", status=400)

        size = end - start + 1
        n = start / size
        # Craft the response json 
        jsonresponse["start"] = start
        jsonresponse["end"] = end
        jsonresponse["total"] = total
        jsonresponse["done"] = end + 1

        bfile = request.files['file']

        datadb = self.get_data_db(dbid)
        if datadb == None:
            return Response("{ \"error \" : \"Invalid database id %s\"}" % (dbid), status=405)
        conn.register([Session])
        sessobj = datadb["sessions"].Session.find_one({"_id" : ObjectId(sessid)})
        if sessobj == None:
            return Response("{ \"error \" : \"Session %s does not exist in db %s\"}" % (sessid, dbid), status=405)
        first = False
        last = False
        # If first chunk
        if start == 0:
            first = True
            jsonresponse["first"] = 1
            # Create a file
            gf = gridfs.GridFS(datadb , restype)
            afile = gf.new_file(chunk_size=1048576, filename=filename, _id=ObjectId(resid))
            afile.write(bfile.read())
            afile.close()

        if total == end + 1:
            last = True
            jsonresponse["last"] = 1
            # Add the attachment id to the 
            if not sessobj.has_key("attachments"):
                sessobj["attachments"] = [ {"ref" : ObjectId(resid), "pos" : 0}]
                sessobj.validate()
                sessobj.save()
#                print "Inserted attachments", str(sessobj["attachments"])
            else:
                size_before = len(sessobj["attachments"])
                sessobj["attachments"].append({"ref" : ObjectId(resid), "pos" : size_before + 1})
                sessobj.validate()
                sessobj.save()
#                print "Appended to  attachments", str(sessobj["attachments"])

        if not first:
            obj = {}
            obj["n"] = n
            obj["files_id"] = ObjectId(resid)
            obj["data"] = Binary(bfile.read())

            datadb["attachments.chunks"].insert(obj)
            fileobj = datadb["attachments.files"].find_one({"_id" : obj["files_id"]})
            datadb["attachments.files"].update({"_id" : obj["files_id"]}, {"$set" : {"length" : fileobj["length"] + len(obj["data"])}})

        # Finalize
        # Append to the chunks collection
        return jsonify(jsonresponse)


    def post(self, dbid, sessid, restype, resid=None):
        if resid == None:
            # Supported for new creations 
            if restype == "attachments" or restype == "rawfiles":
                data = request.form
                # Only insert command is supported
                if data == None:
                    return Response("{\"error\" : \"Only create method is supported by post \"} " , status=405)

                if data.has_key("insert") :
                    id = ObjectId()
                    # No need to return conventional file list 
                    jsonresponse = {}
                    jsonresponse["_id"] = id
                    jsonresponse["type"] = restype
                    return jsonify(jsonresponse)
                else:
                    return Response("{\"error\" : \"Only create method is supported by post \"} " , status=405)
        else:
            return Response("{\"error\" : \"Only posting to all collections of %s are not implemented yet\"} " % (restype) , status=405)

# For a list of resources within session
mod.add_url_rule('/<regex("[a-f0-9]{24}"):dbid>'
                                '/sessions'
                                '/<regex("[a-f0-9]{24}"):sessid>'
                                '/<regex("(attachments|views)"):restype>'
                                , view_func=DataSessionItemsAPI.as_view("show_session_items"),
                                defaults={'resid':None},
                                methods=["get", "post"])

# For a particular resource from lists (e.g. attachments) within session
mod.add_url_rule('/<regex("[a-f0-9]{24}"):dbid>'
                                '/sessions'
                                '/<regex("[a-f0-9]{24}"):sessid>'
                                '/<regex("(attachments|views|images)"):restype>'
                                '/<regex("[a-f0-9]{24}"):resid>'
                                , view_func=DataSessionItemsAPI.as_view("show_session_item"),
                                methods=["get", "put"])

# For a list of resources within session
mod.add_url_rule('/<regex("[a-f0-9]{24}"):dbid>'
                                '/sessions'
                                '/<regex("[a-f0-9]{24}"):sessid>'
                                , view_func=DataSessionsAPI.as_view("show_session"),
                                methods=["get", "delete", "post"])

# For a list of resources within session
mod.add_url_rule('/<regex("[a-f0-9]{24}"):dbid>'
                                '/sessions'
                                , view_func=DataSessionsAPI.as_view("show_sessions"),
                                methods=["get", "post"])


# Specially for session

# Render admin template
@mod.route('/admin')
@site_admin_required(True)
def admin_main():
    """
    Single page application with uses this rest API to interactively do tasks
    """
    return Response(render_template("admin.html"))
