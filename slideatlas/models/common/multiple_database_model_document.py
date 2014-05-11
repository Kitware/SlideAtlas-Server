# coding=utf-8

from flask import g
from mongoengine.connection import get_db

from .model_document import ModelDocument, ModelQuerySet

################################################################################
__all__ = ('MultipleDatabaseModelDocument',)


################################################################################
class MultipleDatabaseModelQuerySet(ModelQuerySet):
    def __init__(self, document, collection):
        # make a local copy of the Document class for this QuerySet, to prevent
        #   database, so that new attributes can be set on it
        new_document = self._copy_class(document)

        # this copies what may be class-level attributes from 'document',
        #   to instance-level attributes on 'new_document', freezing them
        current_db_alias = document._get_db_alias()
        new_document._get_db_alias = staticmethod(lambda: current_db_alias)
        current_collection = document._get_collection()
        new_document._get_collection = staticmethod(lambda: current_collection)
        super(MultipleDatabaseModelQuerySet, self).__init__(new_document, collection)

    @staticmethod
    def _copy_class(cls):
        # TODO: move this to a common utils
        new_cls_dict = dict(cls.__dict__)
        new_cls_dict['meta'] = new_cls_dict.pop('_meta')
        return type(cls.__name__, cls.__bases__, new_cls_dict)


class MultipleDatabaseModelDocument(ModelDocument):
    """
    An abstract class for documents that may reside in one of multiple databases.
    """
    # TODO: prevent this class from being instantiated directly
    meta = {
        'abstract': True,
        'allow_inheritance': False,
        'db_alias': None,  # this shouldn't actually be used
        'queryset_class': MultipleDatabaseModelQuerySet,
        'auto_create_index': False,  # don't change; see '_get_collection' for why this is set
    }

    @property
    def database(self):
        # the import is required here to prevent circular imports
        # TODO: remove this import statement
        from ..image_store import MultipleDatabaseImageStore
        return MultipleDatabaseImageStore.objects.with_id(self._db_alias)


    @classmethod
    def _get_db_alias(cls):
        """
        Helper method to provide the current database, as set by a
        MultipleDatabaseImageStore context manager.

        This would be better as a property, but Python has poor support for
        classmethod descriptors, particularly with mutators.
        """
        try:
            return g.multiple_database_connection_aliases[-1]
        except (AttributeError, IndexError):
            raise NotImplemented('A "%s" must be used inside a "MultipleDatabaseImageStoreMixin" context (\'with\' statement).' % cls.__name__)

    @classmethod
    def _get_db(cls):
        """
        Overrides the Document._get_collection classmethod.

        This will only be called on class instances, as instantiated objects
        have this method patched by 'self.switch_db'.
        """
        return get_db(cls._get_db_alias())


    @classmethod
    def _get_collection(cls):
        """
        Overrides the 'Document._get_collection' classmethod.

        This method attempts to provide some degree of caching, preventing a
        new collection from having to be created on every access, while still
        allowing the database to change.

        Unlike for databases, MongoEngine doesn't store an internal cache for
        multiple collections per class, so one is created here, and used
        instead of the single '_collection' cache.

        This will only be called on class instances, as instantiated objects
        have this method patched by 'self.switch_db'.
        """
        if issubclass(MultipleDatabaseModelDocument, cls):
            # setting the '_collections' property on one of the common base
            #   classes would prevent the derived classes from having their own
            #   seperate instances of the property
            raise NotImplementedError('"_get_collection" should only be called on concrete model classes.')
        if not hasattr(cls, '_collections'):
            cls._collections = dict()

        db_alias = cls._get_db_alias()
        try:
            cls._collection = cls._collections[db_alias]
        except KeyError:
            cls._collection = None
            # 'cls._collection' is set as a side effect of the superclass
            #   '_get_collection'
            cls._collections[db_alias] = super(MultipleDatabaseModelDocument, cls)._get_collection()
            # unless meta['auto_create_index'] is false, the superclass
            #   '_get_collection' will attempt to call 'ensure_indexes', which
            #   in turn calls '_get_collection', leading to infinite recursion
            # so, wait until the necessary '_collection' / '_collections' values
            #   are set after the return, and only then call 'ensure_indexes'
            cls.ensure_indexes()
        return cls._collection


    def __init__(self, *args, **kwargs):
        super(MultipleDatabaseModelDocument, self).__init__(*args, **kwargs)

        # make the new database persistent to this instance
        # cls_db_alias = type(self)._get_db_alias()
        cls_db_alias = self._get_db_alias()
        self._db_alias = cls_db_alias  # save the value for use in the 'database' property
        self.switch_db(cls_db_alias)  # this patches over 'self._get_db'
