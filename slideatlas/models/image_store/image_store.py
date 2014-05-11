# coding=utf-8

from flask import g
from mongoengine import StringField
from mongoengine.connection import get_db

from ..common import ModelDocument, MultipleDatabaseModelDocument, \
    register_database
from .. import session  # TODO: try to remove this

################################################################################
__all__ = ('ImageStore', 'MultipleDatabaseImageStore')

# Abstract definitions for asset store


################################################################################
class ImageStore(ModelDocument):
    """
    An ImageStore holds image metadata and tiles.
    """
    meta = {
        'db_alias': 'admin_db',
        'collection': 'databases',
        'allow_inheritance' : True,
        #'abstract': True,
    }

    label = StringField(required=True, #TODO: make unique
        verbose_name='Label', help_text='The human-readable label.')

    copyright = StringField(required=False, default='Copyright &copy 2014. All rights reserved.',
        verbose_name='Copyright', help_text='The default copyright for content.')

    def __unicode__(self):
        return unicode(self.label + self.copyright)

    def get_tile(self, image_id, tile_name):
        # TODO: make this use 'abc.abstractmethod', so that all instantiated
        #   subclasses are forced to implement it
        raise NotImplementedError()

    def get_thumb(self, image):
        raise NotImplementedError()


################################################################################
class MultipleDatabaseImageStore(ImageStore):
    """
    This contains all fields and logic for any ImageStore with some or all of
    its data stored in a separate Mongo database.

    Other future types of ImageStore may have all data stored in another system,
    and would not inherit from this class.
    """
    meta = {
        #'abstract': True,
    }

    host = StringField(required=True, # TODO: change to URLField
        verbose_name='Host', help_text='The URL of the database\'s host.')

    replica_set = StringField(required=False,
        verbose_name='Replica Set Name', help_text='The replica set name, if the database is a member of one, or None otherwise.')

    dbname = StringField(required=True,
        verbose_name='Database Name', help_text='The internal Mongo name of the database.')

    username = StringField(required=False,
        verbose_name='Username', help_text='The username required to connect to the database.')

    password = StringField(required=False,
        verbose_name='Password', help_text='The password required to connect to the database.')

    # TODO: remove 'auth_db' in favor of direct login
    auth_db = StringField(required=False,
        verbose_name='Authentication Database', help_text='The database to authenticate against.')

    @property
    def connection_alias(self):
        return str(self.id)


    def register(self):
        register_database(
            alias=self.connection_alias,
            host=self.host,
            dbname=self.dbname,
            replica_set=self.replica_set,
            username=self.username,
            password=self.password
        )


    def __enter__(self):
        self.register()
        try:
            g.multiple_database_connection_aliases.append(self.connection_alias)
        except AttributeError:
            g.multiple_database_connection_aliases = [self.connection_alias]


    def __exit__(self, exc_type, exc_value, traceback):
        g.multiple_database_connection_aliases.pop()


    def to_pymongo(self, raw_object=False):
        """"
        [deprecated]
        This is for temporary convenience, as all database access is migrated to models.

        This will be removed once the migration is complete, so please don't rely more than
        necessary upon it.

        :param raw_object: return a raw database object, which does not handle
        AutoReconnect exceptions, but is required for GridFS
        """
        self.register()

        database = get_db(self.connection_alias)
        if raw_object:
            return database.__dict__['conn']
        return database
