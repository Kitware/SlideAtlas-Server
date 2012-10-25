import datetime
import mongokit
from bson import ObjectId


class UserMigration(mongokit.DocumentMigration):
    def migration01__add_first_login_field(self):
        self.target = {'name':{'$exists':True}, 'first_login':{'$exists':False}}
        self.update = {'$set':{'first_login':datetime.datetime.utcnow()}}


class User(mongokit.Document):
    use_schemaless = True
    structure = {
        'type' : basestring,
        'name' : basestring, # is email
        'label' : basestring,
        'rules' : [ObjectId],
        'last_login' : datetime.datetime,
        'first_login' : datetime.datetime,
        }

    default_values = {
             'rules': [],
             'last_login': datetime.datetime.utcnow(),
             'first_login' :datetime.datetime.utcnow()
             }

#    migration_handler = UserMigration
    required_fields = ['type', 'name', 'label']

    def update_last_login(self):
        self["last_login"] = datetime.datetime.utcnow()
