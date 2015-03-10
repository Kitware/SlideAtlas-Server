# coding=utf-8

from mongoengine.base import TopLevelDocumentMetaclass
from flask.ext.mongoengine import Document, BaseQuerySet

from .mixins import ToSonDocumentMixin

################################################################################
__all__ = ('ModelDocument',)


################################################################################
class ModelQuerySet(BaseQuerySet):
    def to_son(self, **kwargs):
        return [document.to_son(**kwargs) for document in self]


################################################################################
class ModelDocumentMetaclass(TopLevelDocumentMetaclass):
    def __init__ (cls, name, bases, attrs):
        # TopLevelDocumentMetaclass has a bug where it doesn't add 'id' to the
        #   db_field_map of classes that are not derived from another
        #   non-abstract class
        cls._db_field_map['id'] = '_id'
        cls._reverse_db_field_map['_id'] = 'id'
        # superclass init is a no-op currently, but make the call to be safe
        super(ModelDocumentMetaclass, cls).__init__(name, bases, attrs)


################################################################################
class ModelDocument(Document, ToSonDocumentMixin):
    """
    A base class for all models.

    This uses Flask-MongoEngine as a base, to provide extra convenience methods.
    """
    __metaclass__ = ModelDocumentMetaclass
    # DocumentMetaclass has limited functionality if 'my_metaclass' is
    #   explicitly set to any subclass of DocumentMetaclass, so make it None
    my_metaclass = None

    meta = {
        'abstract': True,
        'queryset_class': ModelQuerySet,
    }

    def __unicode__(self):
        try:
            if self.label:
                return u'%s ("%s")' % (self.id, self.label)
        except AttributeError:
            pass
        return unicode(self.id)
