from mongoengine import StringField, IntField, FloatField, ListField
from mongoengine import register_connection
from mongoengine.connection import _connection_settings, get_db
from bson import Binary

from .common import ModelDocument, MultipleDatabaseModelDocument

class Image(MultipleDatabaseModelDocument):
    """
    The model Image record, any methods will go into a mixin

    """

    use_schemaless = True

    meta = {
        'db_alias': 'admin_db',
        'collection': 'images',
        'allow_inheritance' : True,
    }

    filename = StringField(required=True, #TODO: filename with respect to root_path 
        verbose_name='Filename', help_text='The filename of incoming image excluding path')

    label = StringField(required=True, #TODO: make unique
        verbose_name='Label', help_text='The human-readable label for the image')

    origin = ListField(FloatField(), required=True, #TODO: make unique
        verbose_name='Origin', help_text='Origin', default=[0.,0.,0.])

    spacing = ListField(FloatField(), required=True, #TODO: make unique
        verbose_name='Spacing', help_text='Spacing', default=[1.,1.,1.])

    dimensions = ListField(IntField(), required=True, #TODO: make unique
        verbose_name='Dimension', help_text='Spacing', default=[0,0,0])

    levels = IntField(required=True, #TODO: make unique
        verbose_name='Levels', help_text='Levels in multiresolution pyramid', default=0)

    components = IntField(required=True, #TODO: make unique
        verbose_name='Components', help_text='Levels in multiresolution pyramid', default=3)

    # New fields 

    CoordinateSystem = StringField(choices=["Pixel", "Photo"], default="Pixel")

    TileSize = IntField(required=True, #TODO: make unique
        verbose_name='TileSize', help_text='dimensions of each square tile', default=256)

    bounds = ListField(IntField(), required=True, default=[0,0,0,0,0,0]) 


    def __unicode__(self):
        return unicode(self.label + self.copyright)


