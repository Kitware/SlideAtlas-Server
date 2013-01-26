from slideatlas import site_slideatlas as site
import pymongo
import datetime

# Boilerplate to get database connection
conn = pymongo.Connection(site.MONGO_SERVER)
admindb = conn["admin"]
if site.LOGIN_REQUIRED:
    admindb.authenticate(site.USERNAME, site.PASSWORD)

def logparse(dbname):
    """
    Parse the log and return the useful facts dictionary
    Importantly anonymize data
    """
    print
    print "###"
    print dbname
    print "###"

    db = conn[dbname]
    logs = db["log"].find()
    result = {}

    result["image_loads"] = logs.count()
    result["unique_images"] = 0

    alog = db["log"].find_one(skip=3)

#    print "Log Object -"
#    for akey in alog:
#        print "    ", akey, ", ", alog[akey]

    users = set([])
    images = set([])
    days = set([])
    daily = {}

    # Find unique users
    for alog in logs:
        if "user" in alog:
            users.update([str(alog["user"]["_id"]), ])
            images.update([alog["img_id"], ])
            time = alog["time"].strftime("%j%b%y")
            days.update([time, ])
            if not time in daily:
                # A set for finding unique images, and total images
                daily[time] = { "images" :  [ [], set([])] ,
                                        "users" : [ [], set([]) ],
                                        "time": alog["time"]
                                        }
            daily[time]["images"][0].append([alog["img_id"], ])
            daily[time]["users"][0].append([str(alog["user"]["_id"]), ])
            daily[time]["images"][1].update([alog["img_id"], ])
            daily[time]["users"][1].update([str(alog["user"]["_id"]), ])

        # split time into days
    daylist = daily.keys()

    print daylist

    for aday in sorted(daylist):
        a = daily[aday]
        print a["time"].strftime("%a"), aday, ":"
        print  "    ", "images:", len(a["images"][0]), len(a["images"][1])
        print  "    ", "users:", len(a["users"][0]), len(a["users"][1])

    result["unique_users"] = len(users)
    result["unique_images"] = len(images)

    print "Result - "
    for akey in result:
        print "    ", akey, ", ", result[akey]

    return result

if __name__ == "__main__":
    result = logparse("bev1")
    result = logparse("bidmc1")
    result = logparse("paul3")
