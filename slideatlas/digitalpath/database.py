import mongoengine

class Database(mongoengine.Document):
    meta = {
        'collection': 'databases',
        'db_alias': 'admin',
        'allow_inheritance': True
        }

    label = mongoengine.StringField(required=True)
    host = mongoengine.StringField(required=True)
    dbname = mongoengine.StringField(required=True)
    copyright = mongoengine.StringField(required=True)
