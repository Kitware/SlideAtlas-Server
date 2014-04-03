# coding=utf-8

from mongoengine import register_connection
from mongoengine.connection import get_db
from flask.ext.mongoengine import Document, BaseQuerySet

import database  # to prevent circular import problems, this must be an implicit relative import of the whole module

################################################################################
__all__ = ('register_admin_db',)


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
class ModelDocument(Document):
    """
    A base class for all models.

    This uses Flask-MongoEngine as a base, to provide extra convenience methods.
    """
    meta = {
        'abstract': True
    }


################################################################################
class MultipleDatabaseQuerySet(BaseQuerySet):
    def __init__(self, document, collection):
        # Make a local copy of the Document class for this QuerySet, to prevent database
        # info from being changed once a context manager exists
        new_document = self.copy_class(document)

        # '_db_alias' is possibly inherited from a base class of 'document',
        # but we need to ensure that its set as a direct property of 'new_document'
        new_document._db_alias = document._db_alias
        new_document._collection = document._collection
        super(MultipleDatabaseQuerySet, self).__init__(new_document, collection)

    @staticmethod
    def copy_class(cls):
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
        'queryset_class': MultipleDatabaseQuerySet,
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

