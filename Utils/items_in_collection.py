# Should be named Attachments.py

import pymongo
import gridfs
import bson
import sys

class MongoApp():
    """
    In future also manage the secure connection etc
    """
    def __init__(self, db):
        self.db = db

class ItemsInGridFSMixin():
    """
    Adds functionality for storing large items using gridfs
    Does not stand on its own. Requires instance of MongoApp
    """
    def __init__(self):
        # create a gridfs session from known information
        self.gf = gridfs.GridFS(self.db, self.item_type)

    def Flush(self):
        print "Removing", self.item_type + "from grid .."
        self.db[self.item_type + ".files"].drop()
        self.db[self.item_type + ".chunks"].drop()

    def Insert(self, data, name):
        """ Accepts the data to store"""
        # Put the attachment in the gridfs and call the base insertion to add the id in the session
        newid = bson.ObjectId()
        # Store the id in the grid file system
        self.gf.put(data, filename=name, _id=newid)
        return newid

    def List(self, fid):
        item = self.gf.get(fid)
        return item

    def Delete(self, deleteid):
        self.gf.delete(deleteid)

    def Get(self, getid):
        # Make sure getid
        try:
            getid = bson.ObjectId(getid)
            out = self.gf.get(getid)
            return out
        except:
            print 'No objectid'
            # find the id from filename
        try:
            out = self.gf.get_version(filename=getid)
            return out
        except:
            print "No matching file found"

        return None

class ItemsInSessionMixin():
    """
    Derived classes neeed to take care of the individual storage and then add to the metadata using base class
    Does not stand on its own, requires self.db an initialized mongodb instance
    """
    def __init__(self, session):
        """ accepts type of object, pymongo db instance, the root string to avoid conflicting names and sessions key """
        self.session = session

    def Insert(self, newid):
        """ Accepts the data to store"""
        # Get the list

        objects = ItemsInSessionMixin.List(self)
        # print 'Got list:', objects

        max = 0

        for anobject in objects:
            # print anobject
            if anobject['pos'] > max:
                max = anobject['pos']

        new_object = {}
        new_object[u'ref'] = newid
        new_object[u'pos'] = max + 1
        new_object[u'hide'] = False

        # print 'Created', new_object

        objects.append(new_object)
        self.db['sessions'].update({'_id': self.session['_id']}, {'$set':{self.item_type: objects}})

    def List(self):
        self.session = self.db['sessions'].find_one({'_id' : self.session['_id']})
        try :
            return self.session[self.item_type]

        except KeyError:
            print 'No', self.item_type, 'record in the session'
            return []

    def Flush(self):
        # remove attachments field from the session object
        self.db['sessions'].update({ "_id" : self.session['_id']}, {'$unset' : {self.item_type :1} })

    def Delete(self, deleteid):
        # Remove the record in the session and possibly reorder
        # verify if the attachment is listed in the session

        self.session = self.db['sessions'].find_one({'_id' : self.session['_id']})
        attachments = self.session[self.item_type]
        #print 'Before :', attachments
        found = False
        for anattachment in attachments:
            if anattachment['ref'] == deleteid:
                found = True
                attachments.remove(anattachment)

        if found:
            #print "After: ", attachments
            self.db['sessions'].update({'_id': self.session['_id']}, {'$set':{'attachments': attachments}})


class Attachments(MongoApp, ItemsInSessionMixin, ItemsInGridFSMixin):
    def __init__(self, db, session):
        """ init subclasses with proper variables """
        MongoApp.__init__(self, db)
        self.item_type = 'attachments'
        ItemsInGridFSMixin.__init__(self)
        ItemsInSessionMixin.__init__(self, session)

    def Insert(self, data, name):
        """ Accepts the data to store"""
        # Put the attachment in the gridfs and
        newid =     ItemsInGridFSMixin.Insert(self, data, name)
        ItemsInSessionMixin.Insert(self, newid)

    def Flush(self):
        # Remove all records
        ItemsInGridFSMixin.Flush(self)
        ItemsInSessionMixin.Flush(self)

    def List(self):
        print "Listing from session :"
        items = ItemsInSessionMixin.List(self)

        for anitem in items:
            out =     ItemsInGridFSMixin.List(self, anitem['ref'])
            print anitem['pos'], out._id, out.name, out.length

    def Delete(self, delete_key):
        # make sure that the id exists

        found = False

        # TODO: start here
        try:
            deleteid = bson.ObjectId(delete_key)
            # Get the id from the name

            items = ItemsInSessionMixin.List(self)

            for anitem in items:
                if anitem['ref'] == deleteid:
                    found = deleteid

        except:
            print "Key is not ObjectId"
            return

        if found:
            print 'Deleting ..'

            # Remove from session
            ItemsInSessionMixin.Delete(self, deleteid)

            # Remove from gridfs
            ItemsInGridFSMixin.Delete(self, deleteid)
        else:
            print 'Nothing deleted'
