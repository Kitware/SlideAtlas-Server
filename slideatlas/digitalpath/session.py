import mongoengine

import image
import attachment

class Session(mongoengine.Document):
    meta = {
        'collection': 'sessions',
        'db_alias': 'data',
        'allow_inheritance': False
        }

    name = mongoengine.StringField(required=True)
    label = mongoengine.StringField(required=True)
    images = mongoengine.ListField(mongoengine.EmbeddedDocumentField(image.ImageRefListElem), required=True)
    attachments = mongoengine.ListField(mongoengine.EmbeddedDocumentField(attachment.AttachmentRefListElem))
