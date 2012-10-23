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

grant_Malignant_Melanoma(db)


#4ec4504824c1bf4b93009bdd
print "Done"
