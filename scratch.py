
# Defines multiple configuration settings used by slideatlas

ADMIN_DB = "mongodb://127.0.0.1:27017/slideatlas"

from slideatlas import model
from slideatlas import slconn

slconn.register([model.User, model.Database])

#recs = slconn["slideatlasv2"]["users"].find()
recs = slconn["slideatlasv2"]["users"].User.fetch({'type':'facebook'})
#recs = slconn["slideatlasv2"]["databases"].Database.fetch()

if recs != None:
    for arec in recs:
        if arec != None:
            print arec["name"]
#            print ""
#            for key in arec:
#                print key, " " , arec[key]

