
import mongoengine

import common


# TODO: fix this whole thing

class Attachment(mongoengine.Document):
    meta = {
        'collection': 'attachments',
        'db_alias': 'data',
        'allow_inheritance': False
        }

    filename = mongoengine.StringField(required=True)
    #mongoengine.FileField(db_alias='data', collection_name='attachments')





class AttachmentRefListElem(common.RefListElem):
    ref = mongoengine.ReferenceField(Attachment, required=True)


