# coding=utf-8

from mongoengine import ListField, ReferenceField, StringField

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

    image_store = ReferenceField(ImageStore, required=False, # TODO: deprecated
        verbose_name='Image Store', help_text='The default image store for content uploaded to this collection.')

    label = StringField(required=True, #TODO: make unique
        verbose_name='Label', help_text='The human-readable label.')

    copyright = StringField(required=True, default='Copyright &copy; 2014. All rights reserved.',
        verbose_name='Copyright', help_text='The default copyright for content.')

    creator_codes = ListField(StringField(), required=False,
        verbose_name='Creator Codes', help_text='A list of identifier codes for images to be uploaded to this collection.')

    def __unicode__(self):
        return unicode(self.label)
