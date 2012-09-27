import datetime

import mongoengine

import rule

class User(mongoengine.Document):
    meta = {
        'collection': 'users',
        'db_alias': 'admin',
        'allow_inheritance': True,
        'abstract': True
        }

    type = mongoengine.StringField(required=True)
    name = mongoengine.StringField(required=True, unique_with='type')
    label = mongoengine.StringField(required=False)
    rules = mongoengine.ListField(mongoengine.ReferenceField(rule.Rule), default=list()) # required, but mongoengine won't allow a "required" ListField to be an empty list
#    rules = mongoengine.ListField(mongoengine.ObjectIdField())
    last_login = mongoengine.DateTimeField(required=True, default=datetime.datetime.utcnow())

    def update_last_login(self):
        last_login = datetime.datetime.utcnow()



class PasswordUser(User):
    type = mongoengine.StringField(required=True, choices=('passwd',), default='passwd')
    passwd = mongoengine.StringField(required=True)


class FacebookUser(User):
    type = mongoengine.StringField(required=True, choices=('facebook',), default='facebook')


class GoogleUser(User):
    type = mongoengine.StringField(required=True, choices=('google',), default='google')
