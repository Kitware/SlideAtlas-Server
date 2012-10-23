import datetime
import mongokit
from bson import ObjectId
import rule

class User(mongokit.Document):
    use_schemaless = True
    structure = {
        'type' : basestring,
        'name' : basestring, # is email
        'label' : basestring,
        'rules' : [ObjectId],
        'last_login' : datetime.datetime
        }
    required_fields = ['type', 'name', 'label', 'rules', 'last_login']

    def update_last_login(self):
        self["last_login"] = datetime.datetime.utcnow()
