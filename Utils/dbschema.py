# include from top level
import sys
sys.path.append("..")
from subprocess import call

from slideatlas import model

import mongokit
from bson import ObjectId

# Add a database
HOST = "slide-atlas.org"
#HOST = "ayodhya"
DBNAME = 'slideatlasv2'

def grant_Malignant_Melanoma(dbobj):
    ruledoc = dbobj["rules"].Rule.find_one({'facebook_id':"231408953605826"})
    print "Rule found: ", ruledoc["_id"]
    dbobj["rules"].update({"_id" : ruledoc["_id"]}, { "$push" : {"can_see" : ObjectId("4ec4504824c1bf4b93009bdd")}})
    print "Access should be granted"

def bidmc1_path_residents_rule(dbobj):
    # Find database bidmc1
    dbdoc = dbobj.databases.Database.find_one({"label" : "BIDMC Pathology"})
    print  "Database found:", dbdoc["_id"]

    # Find rule for bidmc1 and path residents facebook group
    ruleobj = dbobj.rules.Rule.find_one({"_id" : ObjectId("50996df502e310124846530f")})
#    ruleobj['label'] = 'Pathology Residents and Fellows BIDMC'
#    ruleobj.save()
    print  "Rule found:", ruleobj["_id"]

#    For facebook group 365400966808177"
#    stud_rule = dbobj.rules.Rule()
#    stud_rule['label'] = 'bidmc1_facebook_365400966808177"'
#    stud_rule['db'] = dbdoc["_id"]
#    stud_rule['can_see'] = [ObjectId("5097ee1758771814549fbd10")]
#    stud_rule['can_see_all'] = False
#    stud_rule["facebook_id"] = "365400966808177"


def rename_and_grant_session8(dbobj):
    """
    Getting admindb object
    """
    sessionid = ObjectId("4ec4504824c1bf4b93009bde")

    conn = dbobj.connection
    db = conn["bev1"]
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "Before Session Label: ", sessionobj["label"]

    newname = "Non-infectious erythematous, papular and squamous disease"
    db["sessions"].update({"_id" : sessionid}, {"$set" : { "label" : newname}})
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "After Session: ", sessionobj

    ruledoc = dbobj["rules"].Rule.find_one({'facebook_id':"231408953605826"})
    print "Rule found: ", ruledoc["_id"]
    dbobj["rules"].update({"_id" : ruledoc["_id"]}, { "$push" : {"can_see" : sessionid}})
    print "Access should be granted"

def rename_and_grant_session12(dbobj):
    """
    Getting admindb object
    """
    sessionid = ObjectId("4ed62213114d971078000000")

    conn = dbobj.connection
    db = conn["bev1"]
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "Before Session Label: ", sessionobj["label"]

    newname = "Non-Infectious Vesiculobullous and Vesiculopustular Diseases"
    db["sessions"].update({"_id" : sessionid}, {"$set" : { "label" : newname}})
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "After Session: ", sessionobj

    return
    ruledoc = dbobj["rules"].Rule.find_one({'facebook_id':"231408953605826"})
    print "Rule found: ", ruledoc["_id"]
    dbobj["rules"].update({"_id" : ruledoc["_id"]}, { "$push" : {"can_see" : sessionid}})
    print "Access should be granted"

def dump_a_session(dbobj, str_session_id):
    """
    Using mongodump to export images in a session from hardcoded database 
    on slideatlas
    """
    sessionid = ObjectId("4ed62213114d971078000000")

    # Create a meta collection connecting to temp db

    conn = dbobj.connection
    db = conn["bev1"]
    sessionobj = db["sessions"].find_one({"_id" : ObjectId(str_session_id)})

#    for aviewid in sessionobj["views"]:
#        viewobj = db["views"].find_one({"_id" : aviewid["ref"]})
#        imgobj = db["images"].find_one({"_id" : viewobj["img"]})
#        print "Processing ", imgobj["filename"]
#        db["claw"].insert(imgobj)
#        params = [ "mongodump", "-h", "slide-atlas.org", "-u", "claw", "-p", "claw123", "-d", "bev1", "-c", str(imgobj["_id"]) ]
#        print params
#        call(params)
    params = [ "mongodump", "-h", "slide-atlas.org", "-u", "claw", "-p", "claw123", "-d", "bev1", "-c", "claw"]
    call(params)

    print "done"

def rename_and_grant_session10(dbobj):
    """
    Getting admindb object
    """
    sessionid = ObjectId("4ec4504824c1bf4b93009be0")

    conn = dbobj.connection
    db = conn["bev1"]
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "Before Session Label: ", sessionobj["label"]

    newname = "Vascular Tumors"
    db["sessions"].update({"_id" : sessionid}, {"$set" : { "label" : newname}})
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "After Session: ", sessionobj

    ruledoc = dbobj["rules"].Rule.find_one({'facebook_id':"231408953605826"})
    print "Rule found: ", ruledoc["_id"]
    dbobj["rules"].update({"_id" : ruledoc["_id"]}, { "$push" : {"can_see" : sessionid}})
    print "Access should be granted"


def rename_and_grant_session(admindbobj, str_session_id, str_newlabel, str_db="bev1", str_group_id="231408953605826"):
    """
    Generic function to rename and grant session
    gets  
    """
    sessionid = ObjectId(str_session_id)

    conn = admindbobj.connection
    db = conn[str_db]
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "Before Session Label: ", sessionobj["label"]

    db["sessions"].update({"_id" : sessionid}, {"$set" : { "label" : str_newlabel}})
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "After Session Label: ", sessionobj["label"]

    ruledoc = admindbobj["rules"].Rule.find_one({'facebook_id':str_group_id})
    print "Rule found: ", ruledoc["_id"]
    admindbobj["rules"].update({"_id" : ruledoc["_id"]}, { "$push" : {"can_see" : sessionid}})
    print "Access should be granted"

def grant_session(admindbobj, str_session_id, str_db, str_group_id):
    """
    Generic function to rename and grant session
    gets  
    """
    sessionid = ObjectId(str_session_id)

    conn = admindbobj.connection
    db = conn[str_db]
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "Session Label: ", sessionobj["label"]
    print "Session: ", sessionobj

    dbdoc = admindbobj["databases"].Database.find_one({'dbname':str_db})
    print dbdoc

    ruledoc = admindbobj["rules"].Rule.find_one({'facebook_id':str_group_id, "db" : dbdoc["_id"]})
    print "Rule found: ", ruledoc["_id"]
    print "Rule: ", ruledoc

    admindbobj["rules"].update({"_id" : ruledoc["_id"]}, { "$push" : {"can_see" : sessionid}})
    print "Access should be granted"

def revoke_session(admindbobj, str_session_id, str_db, str_group_id):
    """
    Generic function to rename and grant session
    gets  
    """
    sessionid = ObjectId(str_session_id)

    conn = admindbobj.connection
    db = conn[str_db]
    sessionobj = db["sessions"].find_one({"_id" : sessionid})
    print "Session: ", sessionobj

    dbdoc = admindbobj["databases"].Database.find_one({'dbname':str_db})
    print dbdoc

    ruledoc = admindbobj["rules"].Rule.find_one({'facebook_id':str_group_id, "db" : dbdoc["_id"]})
    print "Rule found: ", ruledoc["_id"]
    print "Rule: ", ruledoc

    admindbobj["rules"].update({"_id" : ruledoc["_id"]}, { "$pull" : {"can_see" : sessionid}})
    print "Access should be revoked"




def bidmc1_rules(dbobj):
    # find the database 
    dbdoc = dbobj.databases.Database.find_one({"label" : "BIDMC Pathology"})
    print  "Database found:", dbdoc["_id"]

    # For student password users
    stud_rule = dbobj.rules.Rule()
    stud_rule['label'] = 'all_bidmc1'
    stud_rule['db'] = dbdoc["_id"]
    stud_rule['can_see'] = []
    stud_rule['can_see_all'] = True
    stud_rule.save()
    print "Student Rule: ", stud_rule["_id"]

    # For admin password users
    admin_rule = dbobj.rules.Rule()
    admin_rule['label'] = 'all_bidmc1'
    admin_rule['db'] = dbdoc["_id"]
    admin_rule['can_see'] = []
    admin_rule['can_see_all'] = True
    admin_rule['db_admin'] = True
    admin_rule.save()
    print "Admin Rule: ", admin_rule["_id"]

def bidmc1_create_users(dbobj):
#    Connection Authenticated ..
#    Database found: 507f34a902e31010bcdb1366
#    Student Rule:  50982f4c02e31023c02eb22d
#    Admin Rule:  50982f4c02e31023c02eb22e
#    Done

    stud_usr = dbobj.users.User()
    stud_usr["name"] = 'all_bidmc1'
    stud_usr["type"] = 'passwd'
    stud_usr["passwd"] = 'surgpath'
    stud_usr["label"] = 'BIDMC Pathology'
    stud_usr["rules"] = [ ObjectId("50982f4c02e31023c02eb22d") ]
    stud_usr.save()

    admin_usr = dbobj.users.User()
    admin_usr["name"] = 'all_bidmc1_admin'
    admin_usr["type"] = 'passwd'
    admin_usr["passwd"] = 'surgpath12'
    admin_usr["label"] = 'Admin @ BIDMC Pathology'
    admin_usr["rules"] = [ ObjectId("50982f4c02e31023c02eb22e")]
    admin_usr.save()

def insert_BIDMC_KAWAI(dbobj):
    dbdoc = dbobj.databases.Database()
    dbdoc['label'] = 'BIDMC Pathology'
    dbdoc['host'] = HOST
    dbdoc['dbname'] = 'bidmc1'
    dbdoc['copyright'] = 'Copyright &copy 2011-2012, BIDMC Pathology. All rights reserved'
    dbdoc.save()

    dbdoc = dbobj.databases.Database()
    dbdoc['label'] = 'Risa Kawai'
    dbdoc['host'] = HOST
    dbdoc['dbname'] = 'kawai1'
    dbdoc['copyright'] = 'Copyright &copy 2012, Risa Kawai. All rights reserved.'
    dbdoc.save()

def grant_KAWAI1(dbobj):
    # Find a database
    dbdoc = dbobj["databases"].Database.fetch_one({'dbname':"kawai1"})
    print "Database found: ", dbdoc["_id"]

    # Find the a session
    conn = dbobj.connection
    dbkawai = conn["kawai1"]
    sessiondoc = dbkawai["sessions"].Session.find_one({'name':"oct2012"})
    print "Session found: ", sessiondoc["_id"]

#    # Following commented block adds the rule
#    # Create a rule
#    ruledoc = dbobj.rules.Rule()
#    # Gives admin access and all sessions view access
#    ruledoc["label"] = 'Risa Kawai'
#    ruledoc["db"] = ObjectId('507f34a902e31010bcdb1367')
#    ruledoc['can_see'] = [ ObjectId('507f3c295877180e04e98f0d'), ]
#    ruledoc['can_see_all'] = True
#    ruledoc['db_admin'] = True
#
#    ruledoc.validate()
#    ruledoc.save()
#    print "Rule Added: ", ruledoc["_id"]
# ObjectId('5085afee02e3100e64ab9a8c')

    ruledoc = dbobj["rules"].Rule.fetch_one({'label':"Risa Kawai"})
    print "Rule found: ", ruledoc["_id"]

    # Find a user
    userdoc = dbobj["users"].User.fetch_one({'name':"dhanannjay.deo@kitware.com"})

    # Append the rule
    userdoc["rules"].append(ObjectId('5085afee02e3100e64ab9a8c'))
    userdoc.validate()
    print "1 User found: ", userdoc
    userdoc.save()

    # Repeat
    userdoc = dbobj["users"].User.fetch_one({'name':"stephen.turney@gmail.com"})
    userdoc["rules"].append(ObjectId('5085afee02e3100e64ab9a8c'))
    userdoc.validate()
    print "2 User found: ", userdoc
    userdoc.save()

def grant_KAWAI1torisa(dbobj):
    # Find a database
    dbdoc = dbobj["databases"].Database.fetch_one({'dbname':"kawai1"})
    print "Database found: ", dbdoc["_id"]

    # Find the a session
    conn = dbobj.connection
    dbkawai = conn["kawai1"]
    sessiondoc = dbkawai["sessions"].Session.find_one({'name':"oct2012"})
    print "Session found: ", sessiondoc["_id"]

#    # Following commented block adds the rule
#    # Create a rule
#    ruledoc = dbobj.rules.Rule()
#    # Gives admin access and all sessions view access
#    ruledoc["label"] = 'Risa Kawai'
#    ruledoc["db"] = ObjectId('507f34a902e31010bcdb1367')
#    ruledoc['can_see'] = [ ObjectId('507f3c295877180e04e98f0d'), ]
#    ruledoc['can_see_all'] = True
#    ruledoc['db_admin'] = True
#
#    ruledoc.validate()
#    ruledoc.save()
#    print "Rule Added: ", ruledoc["_id"]
# ObjectId('5085afee02e3100e64ab9a8c')

    ruledoc = dbobj["rules"].Rule.fetch_one({'label':"Risa Kawai"})
    print "Rule found: ", ruledoc["_id"]

    # Find a user
    userdoc = dbobj["users"].User.fetch_one({'name':"risa.kawai@gmail.com"})

    # Append the rule
    userdoc["rules"].append(ObjectId('5085afee02e3100e64ab9a8c'))
    userdoc.validate()
    print "1 User found: ", userdoc
    userdoc.save()

def grant_KAWAI1toKo(dbobj):
#    # Find a database
#    dbdoc = dbobj["databases"].Database.fetch_one({'dbname':"kawai1"})
#    print "Database found: ", dbdoc["_id"]

    # Find the a session
    conn = dbobj.connection
    dbkawai = conn["kawai1"]
    sessiondoc = dbkawai["sessions"].Session.find_one({'name':"oct2012"})
    print "Session found: ", sessiondoc["_id"]

    ruledoc = dbobj["rules"].Rule.fetch_one({'label':"Risa Kawai"})
    print "Rule found: ", ruledoc["_id"]

    print ruledoc

    # Find a user
    userdoc = dbobj["users"].User.find_one({'name':"crabchicken@gmail.com"})
    print userdoc

    # Append the rule
    userdoc["rules"].append(ObjectId('5085afee02e3100e64ab9a8c'))
    userdoc.validate()
    print "1 User found: ", userdoc
    #userdoc.save()
    print "Access should be granted"


def del_mrxs_11(db):
    sessid = ObjectId("5097ee1758771814549fbd10")
    viewid = ObjectId("5097fb1f58771822a4dc9411")
    imgid = ObjectId("5097fb1f58771822a4dc940f")

    conn = db.connection
    datadb = conn["bidmc1"]
    sessobj = datadb["sessions"].find_one({"_id" : sessid})
    print "Deleting from: ", sessobj["_id"]

    # Delete the reference from views 
    views = sessobj['views']

    found = False
    for viewobj in views:
        if viewobj['ref'] == viewid:
            # Remove this reference and this image
            found = True
            viewindex = views.index(viewobj)

    if found == True:
        print "Before: ", views
        print "Remove view reference: ", views[viewindex]
        del views[viewindex]
        print "After: ", views

    # Find the images object 
    imgobj = datadb["images"].find_one({"_id" : imgid})
    print "To delete image:", imgobj["_id"]

    # Find the views object 
    viewobj = datadb["views"].find_one({"_id" : viewid})
    print "To delete view:", viewobj["_id"]

    print "Removed reference to view"
    datadb['sessions'].update({'_id': sessobj['_id']}, {'$set':{'views': views}})
#
    print "Removed view"
    datadb['views'].remove({'_id': viewobj['_id']})

    print "Removed image"
    datadb['images'].remove({'_id': imgobj['_id']})

    print "Removed image collection"
    datadb.drop_collection(str(imgid))

    print "Done"

def del_empty_session(db):
    sessid = ObjectId("5069bc295877181cd8000000")

    conn = db.connection
    datadb = conn["bidmc1"]
    sessobj = datadb["sessions"].find_one({"_id" : sessid})
    print "To delete session: ", sessobj["_id"]

    print "Removed session: "
    datadb['sessions'].remove({'_id': sessobj['_id']})

    print "Done"


def get_number_of_all_images(dbobj):
    dbs = ["bev1", "paul3", "bidmc1", "kawai1", "edu1", "jnk1", "wusmneuro1", "bidmcpath1"]

    sum = 0

    for str_db in dbs:
        db = dbobj.connection[str_db]
        count = db["images"].find().count()
        sum = sum + count
        print str_db, count

    print "Total number of images: ", sum

# Authenticate
conn = mongokit.Connection(HOST)
admindb = conn["admin"]

if admindb.authenticate("slideatlasweb", "2&PwRaam4Kw") == 0:
    print "Cannot authenticate"
    sys.exit(0)
else:
    print "Connection Authenticated .."

# List all databases
conn.register([model.Database, model.Rule, model.User, model.Session])
db = conn[DBNAME]

# Add bidmc1 and kawai1 databases
#insert_BIDMC_KAWAI(db)

# Grant kawai1 access to dhanannjay.deo@kitware.com
# and stephen.turney@gmail.com
#grant_KAWAI1(db)

#grant_Malignant_Melanoma(db)

#rename_and_grant_session8(db)
#rename_and_grant_session12(db)
#rename_and_grant_session10(db)
#del_mrxs_11(db)
#del_empty_session(db)
#add_bidmc1_affiliation(db)
#bidmc1_rules(db)
#bidmc1_create_users(db)
# grant_KAWAI1torisa(db)
#grant_KAWAI1toKo(db)

#grant_surgical_slide_november(db)
#bidmc1_path_residents_rule(db)

#rename_and_grant_session(db, str_session_id="4ee92b6483ff8d1cf8000000", str_newlabel="Histiocytoses and non-lymphoid infiltrates")
#get_number_of_all_images(db)
#rename_and_grant_session(db, str_session_id="4ec4504824c1bf4b93009bdf", str_newlabel="Metabolic Disease of the Skin")
#rename_and_grant_session(db, str_session_id="4ec4504824c1bf4b93009be1", str_newlabel="Non-Infectious & Palisading Granulomas")
#grant_session(db, "50e5b46358771825c0cd5f39" , str_db="bidmc1", str_group_id="365400966808177")
#grant_session(db, "50e5c6e358771825c0cd5f4c" , str_db="bidmc1", str_group_id="365400966808177")
#revoke_session(db, "50e5b46358771825c0cd5f39" , str_db="bev1", str_group_id="365400966808177")
#revoke_session(db, "50e5c6e358771825c0cd5f4c" , str_db="bev1", str_group_id="365400966808177")

#dump_a_session(db, "4ec4504824c1bf4b93009bd5")
rename_and_grant_session(db, str_session_id="4f172b6c114d976e99000000", str_newlabel="Tumors of Epidermal Appendages")
rename_and_grant_session(db, str_session_id="4f0dd159ad2f65a90c000000", str_newlabel="Yet more unkowns")

print "Done"