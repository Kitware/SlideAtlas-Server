import pymongo

def wipe_all_attachments():
    conn = pymongo.Connection()
    db = conn["demo"]

    # browse all the sessions
    for asession in db["sessions"].find():
        if asession.has_key("attachments"):
            print asession["label"], " has ", len(asession["attachments"]), " attachments"
            db["sessions"].update({"_id" : asession["_id"]}, {"$set": {"attachments" : [] }})

    db.drop_collection("attachments.chunks")
    db.drop_collection("attachments.files")

if __name__ == "__main__":
    print "Helper routine to wipe all attachments and gridfs in some database"
    print "Handle with care and look at code"
    wipe_all_attachments()

