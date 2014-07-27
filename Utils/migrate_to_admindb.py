import pymongo
import sys


if __name__ == "__main__":
    # move sessions to admin db

    try:
        # Get the password as it will not be comitted
        uname = sys.argv[1]
        pwd = sys.argv[2]
        db_name = sys.argv[3]
        source_session = sys.argv[4]

    except:
        print "Error while parsing command line. Correct use is "
        print "python migrate_to_admindb.py <username> <password> <source_mongodb> <source_session_label>"
        print "Where username and password are for slide-atlas.org admin db"
        sys.exit(0)

    # Nothing below needs to be edited usually
    conn = pymongo.MongoClient("slide-atlas.org")
    admindb = conn["admin"]
    admindb.authenticate(uname,pwd)
    admin_db = conn['slideatlas_live']

    source_db = conn[db_name]
    image_store_id = admin_db['databases'].find_one({'dbname': db_name})['_id']
    collection_id = admin_db['collections'].find_one({'image_store': image_store_id})['_id']
    doc = source_db['sessions'].find_one({"label" : source_session})
    # print doc
    doc['image_store'] = image_store_id
    doc['collection'] = collection_id
    if 'images' in doc:
        del doc['images']
    for view_ref in doc['views']:
        view_ref['db'] = image_store_id

    admin_db['sessions'].save(doc)

