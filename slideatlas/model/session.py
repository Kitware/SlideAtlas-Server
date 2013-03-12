from mongokit import Document
from bson import ObjectId

class RefList(Document):
    structure = {
        'ref' : ObjectId,
        'pos' : float,
        'hide' : bool
        }
    required_fields = [ 'ref', 'pos']



class Session(Document):
    structure = {
        'name' : basestring,
        'label' : basestring,
        'images' : [RefList],
        'attachments' : [RefList],
        'views' : [RefList]
        }

    required_fields = [ 'label']


