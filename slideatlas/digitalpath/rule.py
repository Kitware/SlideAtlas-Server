import mongoengine

import database

class Rule(mongoengine.Document):
    meta = {
        'collection': 'rules',
        'db_alias': 'admin',
        'allow_inheritance': True
        }

    label = mongoengine.StringField(required=True)
    #db = mongoengine.ReferenceField(database.Database, required=True)
    db = mongoengine.ObjectIdField(required=True)
    facebook_id = mongoengine.StringField(required=False) # unique, but mongoengine unique fields are also required (won't allow sparse)
    # TODO: change can_see list to ReferenceField and ensure set_data_db is applied on accessor
    can_see = mongoengine.ListField(mongoengine.ObjectIdField()) # required, but mongoengine won't allow a "required" ListField to be an empty list
    can_see_all = mongoengine.BooleanField(required=False)
