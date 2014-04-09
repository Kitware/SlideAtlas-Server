# coding=utf-8

from bson.son import SON
from mongoengine import register_connection, BooleanField, EmbeddedDocument,\
    EmbeddedDocumentField, ListField, ObjectIdField, StringField
from mongoengine.connection import get_db
from mongoengine.base import TopLevelDocumentMetaclass
from flask.ext.mongoengine import Document, BaseQuerySet

import database  # to prevent circular import problems, this must be an implicit relative import of the whole module

################################################################################
__all__ = ('register_admin_db', 'RefItem')


################################################################################
def register_admin_db(host, dbname, replica_set=None, username=None, password=None, auth_db=None):
    hostname, _, port = host.partition(':')
    kwargs = dict()
    if replica_set:
        # the very presence of a replicaSet argument to 'register_connection' triggers the behavior
        kwargs['replicaSet'] = replica_set
    register_connection(
        alias='admin_db',
        host=hostname,
        port=int(port) if port else None,
        name=dbname,
        username=username,
        password=password,
        **kwargs)


################################################################################
class ModelQuerySet(BaseQuerySet):
    def to_son(self, **kwargs):
        return [document.to_son(**kwargs) for document in self]


class ModelDocumentMetaclass(TopLevelDocumentMetaclass):
    def __init__ (self, name, bases, attrs):
        # TopLevelDocumentMetaclass has a bug where it doesn't add 'id' to the
        #   db_field_map of classes that are not derived from another
        #   non-abstract class
        self._db_field_map['id'] = '_id'
        self._reverse_db_field_map['_id'] = 'id'
        # superclass init is a no-op currently, but make the call to be safe
        return super(ModelDocumentMetaclass, self).__init__(name, bases, attrs)


class ModelDocument(Document):
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


    # def to_json(self):
    #     pass


################################################################################
class MultipleDatabaseModelQuerySet(ModelQuerySet):
    def __init__(self, document, collection):
        # Make a local copy of the Document class for this QuerySet, to prevent database
        # info from being changed once a context manager exists
        new_document = self.copy_class(document)

        # '_db_alias' is possibly inherited from a base class of 'document',
        # but we need to ensure that its set as a direct property of 'new_document'
        new_document._db_alias = document._db_alias
        new_document._collection = document._collection
        super(MultipleDatabaseModelQuerySet, self).__init__(new_document, collection)

    @staticmethod
    def copy_class(cls):
        # TODO: move this to a common utils
        return type(cls.__name__, cls.__bases__, dict(cls.__dict__))


class MultipleDatabaseModelDocument(ModelDocument):
    """
    An abstract class for documents that may reside in one of multiple databases.
    """
    # TODO: prevent this class from being instantiated directly
    meta = {
        'abstract': True,
        'allow_inheritance': False,
        'db_alias': None,  # do not override this in any subclasses
        'queryset_class': MultipleDatabaseModelQuerySet,
    }

    # TODO: reattach _db_alias to the g object, to make changing it thread-safe
    _db_alias = None

    @property
    def database(self):
        return database.Database.objects.with_id(self._db_alias)

    @classmethod
    def _get_db(cls):
        # this function is only called on class instances
        # instantiated objects have this method patched by self.switch_db
        db_alias = cls._db_alias
        if db_alias is None:
            raise NotImplemented('A "%s" must be used inside a "Database" context (\'with\' statement).' % cls.__name__)
        return get_db(db_alias)

    def __init__(self, *args, **kwargs):
        super(MultipleDatabaseModelDocument, self).__init__(*args, **kwargs)
        # make the new database persistent to this instance
        cls_db_alias = type(self)._db_alias
        if cls_db_alias is None:
            raise NotImplemented('"%s._db_alias" should be set before a new "%s" is instantiated.' % (type(self).__name___, type(self).__name___))
        self._db_alias = cls_db_alias  # copy the value from the class to the instance
        self.switch_db(self._db_alias)


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
