# include from top level
import sys
sys.path.append("..")

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


# Authenticate
conn = mongokit.Connection(HOST)
admindb = conn["admin"]

if admindb.authenticate("slideatlasweb", "2%PwRaam4Kw") == 0:
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
# grant_KAWAI1torisa(db)

#grant_Malignant_Melanoma(db)

#rename_and_grant_session8(db)
#rename_and_grant_session12(db)

#add_bidmc1_affiliation(db)
#bidmc1_rules(db)
#bidmc1_create_users(db)

#grant_surgical_slide_november(db)
#bidmc1_path_residents_rule(db)

print "Done"
