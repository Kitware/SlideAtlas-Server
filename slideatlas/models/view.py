# coding=utf-8

from mongoengine import ObjectIdField

from .common import MultipleDatabaseModelDocument

################################################################################
__all__ = ('View',)


################################################################################
class View(MultipleDatabaseModelDocument):
    """
    The model Image record, any methods will go into a mixin
    """
    meta = {
        'collection': 'views',
    }

    img = ObjectIdField(required =True, verbose_name="View object")
