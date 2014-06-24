# coding=utf-8

from mongoengine import ReferenceField, StringField

from .common import ModelDocument
from .image_store import ImageStore

################################################################################
__all__ = ('Collection',)

################################################################################
class Collection(ModelDocument):
    """
    An ImageStore holds image metadata and tiles.
    """
    meta = {
        'db_alias': 'admin_db',
        'collection': 'collections',
    }

    image_store = ReferenceField(ImageStore, required=True,
        verbose_name='Image Store', help_text='')

    label = StringField(required=True, #TODO: make unique
        verbose_name='Label', help_text='The human-readable label.')

    copyright = StringField(required=True, default='Copyright &copy; 2014. All rights reserved.',
        verbose_name='Copyright', help_text='The default copyright for content.')

    def __unicode__(self):
        return unicode(self.label)
