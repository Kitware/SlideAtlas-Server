# coding=utf-8

from mongoengine import EmbeddedDocument, BooleanField, DictField,\
    EmbeddedDocumentField, GenericEmbeddedDocumentField, FloatField, IntField,\
    ListField, ObjectIdField, StringField
from mongoengine.errors import NotRegistered

from .common import MultipleDatabaseModelDocument

################################################################################
__all__ = ('Session', 'RefItem')



################################################################################
class Annotation(EmbeddedDocument):
    meta = {
        'abstract': True,
        'allow_inheritance': True,
        }


class CircleAnnotation(Annotation):
    type = StringField(required=True, default='circle', choices=('circle',))

    origin = ListField(FloatField(), required=False)
    line_width = FloatField(required=False, db_field='linewidth')
    outline_color = ListField(FloatField(), required=False, db_field='outlinecolor') # TODO: convert int fields to float in database
    radius = FloatField(required=False)


class PolylineAnnotation(Annotation):
    type = StringField(required=True, default='polyline', choices=('polyline',))

    closed_loop = BooleanField(required=False, db_field='closedline')
    line_width = FloatField(required=False, db_field='linewidth')
    outline_color = ListField(FloatField(), required=False, db_field='outlinecolor') # TODO: convert int fields to float in database
    points = ListField(ListField(FloatField(), required=True), required=False)


class TextAnnotation(Annotation):
    type = StringField(required=True, default='text', choices=('text',))

    anchor_visibility = BooleanField(required=False, db_field='anchorVisibility')
    color = ListField(FloatField(), required=False) # TODO: convert int fields to float in database
    offset = ListField(IntField(), required=False) # TODO: make float?
    position = ListField(FloatField(), required=False) # TODO: position[2] == 'null' in some instances in database
    size = IntField(required=False) # TODO: make float?
    string = StringField(required=False)


class EmbeddedAnnotationField(GenericEmbeddedDocumentField):
    type_map = {
        'circle': CircleAnnotation,
        'polyline': PolylineAnnotation,
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


class AnnotationRef(EmbeddedDocument):
    annotations = ListField(EmbeddedAnnotationField(), required=False)
    view = ObjectIdField(required=True)


################################################################################
class Transformation(EmbeddedDocument):

    class Correlation(EmbeddedDocument):
        point0 = ListField(FloatField(), required=True)
        point1 = ListField(FloatField(), required=True)

    correlations = ListField(EmbeddedDocumentField(Correlation), required=False, db_field='Correlations',
        verbose_name='', help_text='')

    delta_rotation = FloatField(required=False, db_field='DeltaRotation',
        verbose_name='', help_text='')

    view0 = ObjectIdField(required=False, db_field='View0',
        verbose_name='', help_text='')

    view1 = ObjectIdField(required=False, db_field='View1',
        verbose_name='', help_text='')


################################################################################
class RefItem(EmbeddedDocument):
    meta = {
        'allow_inheritance': False
    }
    ref = ObjectIdField(required=True)
    hide = BooleanField(required=False, default=False)
    label = StringField(required=False)
    db = ObjectIdField(required=False)


class RefListField(ListField):

    def __init__(self, **kwargs):
        #field = ReferenceField(document_type, dbref=False)
        field = EmbeddedDocumentField(RefItem)
        super(RefListField, self).__init__(field, **kwargs)


    def to_mongo(self, value):
        value = super(RefListField, self).to_mongo(value)
        for pos, item in enumerate(value):
            item['pos'] = pos
        return value


    def to_python(self, value):
        try:
            value = sorted(value, key=lambda item: item.pop('pos'))
        except (TypeError, KeyError):
            pass
        return super(RefListField, self).to_python(value)


################################################################################
class Session(MultipleDatabaseModelDocument):
    meta = {
        'collection': 'sessions',
        }

    name = StringField(required=True,
        verbose_name='Name', help_text='The session\'s name.')

    label = StringField(required=True,
        verbose_name='Label', help_text='The sessions\'s label.')

    views = RefListField(required=False,
        verbose_name='Views', help_text='')

    attachments = RefListField(required=False,
        verbose_name='Attachments', help_text='')

    images = RefListField(required=False,
        verbose_name='Images', help_text='')

    annotations = ListField(DictField(), required=False,
        verbose_name='', help_text='')

    hideAnnotations = BooleanField(required=False,
        verbose_name='', help_text='')

    # TODO: discuss this
    # some 'sessions' collections may contain a 'users' field; current values are:
    #   'all_bev1_admin', 'all_wusm_admin', 'brown_demo_admin'
    # what is the purpose of this?
    # user = StringField

    def __unicode__(self):
        return unicode(self.label)


# class StackSession(Session):
#     """
#     There's currently only 1 document of this type, in the '3dpath' database
#     """

    type = StringField(required=False, choices=('stack', 'session'),
        verbose_name='Type', help_text='')

    # TODO: this should be a 'ListField(EmbeddedDocumentField(Transformation), ..'
    transformations = ListField(DictField(), required=False,
        verbose_name='', help_text='')
