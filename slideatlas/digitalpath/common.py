
import mongoengine


#class DataDbDocument(mongoengine.Document):
    #meta = {
        #'abstract': True,
        #'db_alias': 'login'
        #}

    #@classmethod
    #def _get_db(cls):
        #"""Some Model using other db_alias"""
        #return get_db(cls._meta.get("db_alias", DEFAULT_CONNECTION_NAME ))



class RefListElem(mongoengine.EmbeddedDocument):
    ref = mongoengine.ObjectIdField(required=True)
    pos = mongoengine.IntField(required=True)
    hide = mongoengine.BooleanField(required=True)
    label = mongoengine.StringField(required=False)

