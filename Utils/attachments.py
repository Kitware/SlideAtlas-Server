# Command line tool for dealing with file attachments
import os
#import sys
#sys.path.append(os.path.abspath(".."))
from common_utils import *
from items_in_collection import *

# Main to accept command line and do the operation on images.
if __name__ == '__main__':
    # get the command line arguments
    if len(sys.argv) < 5:
        print 'incorrect usage'
        print 'correct use: attachments.exe server database session_key command [path_to_attachment] [output_path]'
        sys.exit(0)

    server = sys.argv[1]
    database = sys.argv[2]
    command = sys.argv[4]
    session_key = sys.argv[3]

    # Try if attachment path is specified
    try:
        attachment_path = sys.argv[5]
    except:
        attachment_path = False

    # Try if output path is specified
    try:
        output_path = sys.argv[6]
    except:
        output_path = False

    try:
        # Try opening the database
        conn = pymongo.Connection(server)
        admindb = conn["admin"]
        admindb.authenticate("slideatlasweb", "2&PwRaam4Kw")
        mongodb = conn[database]
    except:
        print "Error opening ", database, " at ", server
        sys.exit(0)

    if attachment_path:
        print "Attachment path specified"
    else:
        if command != "list" and command != "flush":
            print "Attachment path required"
            sys.exit(0)

    # Get session from session key

    session = get_object_in_collection(mongodb["sessions"], session_key)

    if session == None:
        print "Couldnot locate session from ", session_key
        sys.exit(0)

    # Create the object with that mongodb
    ac = Attachments(mongodb, session)

    # Open the file if insert
    if command == "insert":
        try:
            fin = open(attachment_path, "rb")
            attachdata = fin.read()
            print len(attachdata), 'Bytes read'
        except:
            print "Cannot open attachment"

        [head, tail] = os.path.split(attachment_path)
        ac.Insert(attachdata, tail)

    elif command == 'get':
        if not output_path:
            print 'Output path is required'
            sys.exit(0)
        else:
            fout = open(output_path, 'wb')
            fout.write(ac.Get(attachment_path).read())

    elif command == "delete":
        ac.Delete(attachment_path)
        print "Find and delete"

    elif command == "list":
        ac.List()

    elif command == "flush":
        resp = raw_input('Are you sure you want to flush ?')

        if resp == 'y' or resp == 'Y':
            ac.Flush()

    elif 1:
        print "Unknown command : ", command
        sys.exit(0)

    # Get the id from the session key
    #image_in_session(mongodb, command, session, image, force)
    print "Done .."
    sys.exit(0)
