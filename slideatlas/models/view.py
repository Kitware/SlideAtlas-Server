# coding=utf-8

from mongoengine import EmbeddedDocument, BooleanField, DictField, \
    EmbeddedDocumentField, FloatField, GenericEmbeddedDocumentField, IntField,\
    ListField, LongField, ObjectIdField, StringField
from mongoengine.errors import NotRegistered

from .common import ModelDocument

################################################################################
__all__ = ('View', )


################################################################################
class Options(EmbeddedDocument):
    center = ListField(FloatField(), required=False)
    img = ObjectIdField(required=False)
    db = ObjectIdField(required=False)
    label = StringField(required=False)
    view_height = FloatField(required=False, db_field='viewHeight')
    rotation = FloatField(required=False)


################################################################################
class Annotation(EmbeddedDocument):
    meta = {
        'abstract': True,
        'allow_inheritance': True,
    }


class TextAnnotation(Annotation):
    type = StringField(required=True, default='text', choices=('text',))

    string = StringField(required=False)
    color = ListField(FloatField(), required=False)
    anchor_visibility = BooleanField(required=False, db_field='anchorVisibility')
    offset = ListField(FloatField(), required=False)
    position = ListField(FloatField(), required=False)
    size = IntField(required=False)


class EmbeddedAnnotationField(GenericEmbeddedDocumentField):
    type_map = {
        'text': TextAnnotation,
    }

    def __init__(self, *args, **kwargs):
        super(EmbeddedAnnotationField, self).__init__(
            choices=tuple(self.type_map.itervalues()),
            *args, **kwargs)

    def to_python(self, value):
        try:
            value = super(EmbeddedAnnotationField, self).to_python(value)
        except KeyError:
            try:
                doc_cls = self.type_map[value['type']]
                value = doc_cls._from_son(value)
            except KeyError:
                raise NotRegistered()
        return value


################################################################################
class View(ModelDocument):
    meta = {
        'db_alias': 'admin_db',
        'collection': 'views',
        #'allow_inheritance': True,
        'indexes': [
            {
                'fields': ('image',),
                'cls': False,
                'unique': False,
                'sparse': True,  # TODO: this should not be sparse, but the database needs to be fixed
            },
        ]
    }

    # TODO: this is a string in some places
    image = ObjectIdField(required=True, db_field='img',
        verbose_name='', help_text='')

    # TODO: this should be removed entirely
    imgdb = StringField(required=False,
        verbose_name='', help_text='Optional: For when the image is not in the same database as the view')

    # TODO: this should be removed entirely
    db = ObjectIdField(required=False,
        verbose_name='', help_text='')

    label = StringField(required=False,
        verbose_name='', help_text='')

    bookmarks = ListField(ObjectIdField(), required=False,
        verbose_name='', help_text='')

    def __unicode__(self):
        return unicode(self.label)


# class Note(View):

    # TODO: this is a string in some places
    user = ObjectIdField(required=False, db_field='User',
        verbose_name='', help_text='who created this view / note (email)')

    # TODO: this is always a string in the DB, with a lowercase name...
    user2 = StringField(required=False, db_field='user',
        verbose_name='', help_text='')

    # TODO: should be converted to a DateTimeField
    date = LongField(required=False, db_field='Date',
        verbose_name='', help_text='When this view was created (javascript Date.getTime();)')

    type = StringField(required=False, db_field='Type',
        verbose_name='', help_text='To find out scheme.  Currently set to "Note".')

    # TODO: lowercase named version
    type2 = StringField(required=False, db_field='type',
        verbose_name='', help_text='')

    title = StringField(required=False, db_field='Title',
        verbose_name='', help_text='The short label used in note list or session list of views.')

    hidden_label = StringField(required=False, db_field='HiddenTitle',
        verbose_name='', help_text='Coded title for students.')

    text = StringField(required=False, db_field='Text',
        verbose_name='', help_text='More descriptive and longer text.')

    viewer_records = ListField(DictField(), required=False, db_field='ViewerRecords',
        verbose_name='', help_text='An array of objects defining views.  The client currently supports an array of up to two views for the dual viewer.')

    children = ListField(DictField(), required=False, db_field='Children',
        verbose_name='', help_text='An array of notes objects that replaces bookmarks.')

    # TODO: there are currently no documents with fields of this type in any database
    children_visibility = BooleanField(required=False, db_field='ChildrenVisibility',
        verbose_name='', help_text='A boolean indicating whether the children will be displayed and traversed by default.')

    # TODO: this is a string in some places
    parent_id = ObjectIdField(required=False, db_field='ParentId',
        verbose_name='', help_text='Object id of parent note.  Used when a student makes a comment note which is saved in the Notes collection.')


# class OtherViewFields(MultipleDatabaseModelDocument):
#     """
#     Fields present in the database, but not specified in the schema documentation.
#     """

    coordinate_system = StringField(required=False, db_field='CoordinateSystem',
        verbose_name='', help_text='')


    # TODO: in some places this is a list of both ints and floats
    center = ListField(FloatField(), required=False,
        verbose_name='', help_text='')

    height = IntField(required=False,
        verbose_name='', help_text='')

    options = ListField(EmbeddedDocumentField(Options), required=False,
        verbose_name='', help_text='')
