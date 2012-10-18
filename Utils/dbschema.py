# include from top level
import sys
sys.path.append("..")

from slideatlas import model

import mongokit

# Add a database 
HOST = "slide-atlas.org"
#HOST = "ayodhya"
DBNAME = 'slideatlasv2'


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


# Authenticate 
conn = mongokit.Connection(HOST)
admindb = conn["admin"]

if admindb.authenticate("slideatlasweb", "2%PwRaam4Kw") == 0:
    print "Cannot authenticate"
    sys.exit(0)
else:
    print "Yay"

# List all databases
conn.register([model.Database])
db = conn[DBNAME]

#insert_BIDMC_KAWAI(db)

docs = db.databases.find()

for adoc in docs:
    print adoc
