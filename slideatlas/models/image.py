# coding=utf-8

from mongoengine import EmbeddedDocument, BinaryField, BooleanField,\
    EmbeddedDocumentField, FloatField, GenericEmbeddedDocumentField, IntField,\
    ListField, StringField
from mongoengine.errors import NotRegistered

from .common import MultipleDatabaseModelDocument

################################################################################
__all__ = ('Image',)


################################################################################
class StartupView(EmbeddedDocument):
    center = ListField(FloatField(), required=False)
    rotation = FloatField(required=False)
    zoom = IntField(required=False)


################################################################################
class Annotation(EmbeddedDocument):
    meta = {
        'abstract': True,
        'allow_inheritance': True,
        }

    display_name = StringField(required=False, db_field='displayname')
    color = StringField(required=False)
    points = ListField(ListField(IntField(), required=True), required=False)


class CircleAnnotation(Annotation):
    type = StringField(required=True, default='circle', choices=('circle',))

    radius = IntField(required=False)


class FreehandAnnotation(Annotation):
    type = StringField(required=True, default='freehand', choices=('freehand',))

    measure_type = IntField(required=False, db_field='measuretype')
    closed = IntField(required=False)
    special_type = StringField(required=False, choices=('rectangle',), db_field='specialtype')


class PointerAnnotation(Annotation):
    type = StringField(required=True, default='pointer', choices=('pointer',))


class LinearmeasureAnnotation(Annotation):
    type = StringField(required=True, default='linearmeasure', choices=('linearmeasure',))


class EmbeddedAnnotationField(GenericEmbeddedDocumentField):
    type_map = {
        'circle': CircleAnnotation,
        'freehand': FreehandAnnotation,
        'pointer': PointerAnnotation,
        'linearmeasure': LinearmeasureAnnotation,
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


class Bookmark(EmbeddedDocument):
    annotation = EmbeddedAnnotationField(required=False)
    center = ListField(IntField(), required=False)
    details = StringField(required=False)
    lens = FloatField(required=False)
    title = StringField(required=False)
    zoom = IntField(required=False)


################################################################################
class Image(MultipleDatabaseModelDocument):
    """
    The model Image record, any methods will go into a mixin
    """
    meta = {
        'collection': 'images',
        'allow_inheritance' : True
    }

    filename = StringField(required=False, #TODO: filename with respect to root_path
        verbose_name='Filename', help_text='The filename of uploaded image excluding path')

    label = StringField(required=False, #TODO: make unique
        verbose_name='Label', help_text='The human-readable label for the image')

    origin = ListField(FloatField(), required=False,
        verbose_name='Origin', help_text='x / y / z world coords (necessary to import NDPA annotations)', default=[0.,0.,0.])

    spacing = ListField(FloatField(), required=False,
        verbose_name='Spacing', help_text='x / y / z nanometers/pixel or "1.0" if unknown', default=[1.,1.,1.])

    dimensions = ListField(IntField(), required=False,
        verbose_name='Dimension', help_text='', default=[0,0,0])

    dimension = ListField(IntField(), required=False,
        verbose_name='', help_text='size of non-padded region of base layer. Z dimensions is 1 for pyramid2 and stack size for pyramid3 and stack types (x / y / z pixel coords)')

    levels = IntField(required=False,
        verbose_name='Levels', help_text='Levels in multiresolution pyramid (specific to pyramid2 and pyrmid3 types)', default=0)

    components = IntField(required=False,
        verbose_name='Components', help_text='', default=3)

    # New fields

    coordinate_system = StringField(required=False, choices=('Pixel', 'Photo'), default='Pixel', db_field='CoordinateSystem',
        verbose_name='', help_text='')

    tile_size = IntField(required=False, default=256, db_field='TileSize',
        verbose_name='TileSize', help_text='dimensions of each square tile')

    bounds = ListField(FloatField(), required=False, default=[0,0,0,0,0,0],
        verbose_name='', help_text='xMin / xMax / yMin / yMax nanometers or "Units" if unknown')

    extents = ListField(IntField(), required=False,
        verbose_name='Extents (deprecated)', help_text='int (x / y / z start / end pixel coords)')

    metadataready = BooleanField(required=False,
        verbose_name='', help_text='')

    name = StringField(required=False,
        verbose_name='', help_text='')

    thumb = BinaryField(required=False,
        verbose_name='', help_text='')

    type = StringField(required=False, choices=('stack',),
        verbose_name='', help_text='If this is not set, then assume pyramid2. "stack" is a simple array of images named 1.png, 2.png ...')

    copyright = StringField(required=False,
        verbose_name='', help_text='')

    # TODO: this should be an embedded document
    startup_view = EmbeddedDocumentField(StartupView, required=False,
        verbose_name='', help_text='')

    # TODO: this should be an embedded document
    bookmarks = ListField(EmbeddedDocumentField(Bookmark), required=False,
        verbose_name='', help_text='')

    # TODO: set '_cls' field on all documents in database

    def __unicode__(self):
        # TODO: make these fields required or have a better default representation
        return unicode((self.label or '') + (self.copyright or ''))
