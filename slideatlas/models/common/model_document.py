# coding=utf-8

from bson.son import SON
from mongoengine.base import TopLevelDocumentMetaclass
from flask.ext.mongoengine import Document, BaseQuerySet

################################################################################
__all__ = ('ModelDocument', 'ModelQuerySet')


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
class ToSonDocumentMixin(object):
    def to_son(self, include_empty=True, exclude_fields=None, only_fields=None):
        """
        Return as a SON object.

        The content is identical to the result of 'to_mongo', except that empty
        fields are included and fields use their model names, instead of
        database names (e.g. '_id' -> 'id').

        Optionally, if include_empty is True (as it is by default), empty fields
        are included.

        Optionally, either of 'exclude_fields' or 'only_fields' (but not both)
        may be specified, containing an iterable of field names to explicitly
        include or exclude from the result. The 'id' field is always included.
        """
        if exclude_fields and only_fields:
            raise Exception()

        # TODO: convert reference fields as {'id':.., 'label':..}

        # SON is ordered, so we must build a new one to change keys
        reverse_db_field_map = dict(self._reverse_db_field_map)
        reverse_db_field_map['_cls'] = 'type'
        son = SON( (reverse_db_field_map[mongo_field], value)
                   for (mongo_field, value)
                   in self.to_mongo().iteritems() )

        if include_empty:
            # 'to_mongo' omits empty fields
            for field_name in self:
                son.setdefault(field_name, None)

        if exclude_fields:
            for field in exclude_fields:
                if field != 'id':
                    # use 'pop', in case 'include_empty' is False and the field doesn't exist
                    son.pop(field, None)
        elif only_fields:
            only_fields = set(only_fields)
            only_fields.add('id')  # always include 'id'
            for field in son.iterkeys():
                if field not in only_fields:
                    del son[field]

        return son


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
