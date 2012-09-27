import mongoengine

import common

class Image(mongoengine.Document):

    class StartupView(mongoengine.EmbeddedDocument):
        zoom = mongoengine.IntField(required=True)
        center = mongoengine.ListField(mongoengine.FloatField(), required=True)
        rotation = mongoengine.FloatField(required=True)


    class Bookmark(mongoengine.EmbeddedDocument):

        class Annotation(mongoengine.EmbeddedDocument):
            type = mongoengine.StringField(required=True)
            displayname = mongoengine.StringField(required=True)
            color = mongoengine.StringField(required=True)
            points = mongoengine.ListField(mongoengine.ListField(mongoengine.IntField()), required=True)

        class PointerAnnotation(Annotation):
            type = mongoengine.StringField(required=True, choices=('pointer',))

        class CircleAnnotation(Annotation):
            type = mongoengine.StringField(required=True, choices=('circle',))
            radius = mongoengine.IntField(required=True)

        title = mongoengine.StringField(required=True)
        details = mongoengine.StringField(required=True)
        center = mongoengine.ListField(mongoengine.IntField(), required=True)
        lens = mongoengine.FloatField(required=True)
        zoom = mongoengine.IntField(required=False)
        annotation = mongoengine.EmbeddedDocumentField(Annotation, required=True)

    meta = {
        'collection': 'images',
        'db_alias': 'data',
        'allow_inheritance': False
        }

    name = mongoengine.StringField(required=True)
    # label = deprecated
    origin = mongoengine.ListField(mongoengine.IntField(), required=True)
    dimension = mongoengine.ListField(mongoengine.IntField(), required=True)
    spacing = mongoengine.ListField(mongoengine.IntField(), required=True)
    startup_view = mongoengine.EmbeddedDocumentField(StartupView, required=False)
    bookmarks = mongoengine.ListField(mongoengine.EmbeddedDocumentField(Bookmark)) # required, but mongoengine won't allow a "required" ListField to be an empty list


class ImageRefListElem(common.RefListElem):
    ref = mongoengine.ReferenceField(Image, required=True)
