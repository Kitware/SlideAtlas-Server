import mongokit
from bson import ObjectId

import database

class Rule(mongokit.Document):
    structure = {
        'label' : basestring,
        'db' : ObjectId,
        'facebook_id' : basestring,
        'can_see' : [ObjectId],
        'can_see_all' : bool
    }

required_fields = ['label', 'db']
