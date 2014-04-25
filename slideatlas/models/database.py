# coding=utf-8

from mongoengine import StringField
from mongoengine.connection import get_db

from .common import ModelDocument, MultipleDatabaseModelDocument, \
    register_database
import session  # again implicit relative import due to circular issues, but we will try to remove this one

################################################################################
__all__ = ('TileStore', 'Database')

# Abstract definitions for asset store

class TileStore(ModelDocument):
    """
    Class dealing with endpoints image tiles

    """
    meta = {
        'db_alias': 'admin_db',
        'collection': 'databases',
        'allow_inheritance' : True,
    }

    label = StringField(required=True, #TODO: make unique
        verbose_name='Label', help_text='The human-readable label for the database.')

    copyright = StringField(required=False, default='Copyright &copy 2014, All rights reserved.',
        verbose_name='Copyright', help_text='The default copyright for content in the database.')

    def __unicode__(self):
        return unicode(self.label + self.copyright)

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
        # TODO: 'MultipleDatabaseModelDocument._subclasses' contains a list with all of the subclasses
        #  (including itself), but as strings; we need a way to get the actual class object, so it can
        #  be modified;
        #  maybe make a new metaclass to do it, but then it must fake that its 'my_metaclass'
        #  until then, we have to explicitly enumerate the classes, which is hard to maintain
        for cls in [MultipleDatabaseModelDocument, session.Session]:
            cls._db_alias = self.connection_alias
            cls._collection = None  # clear any cached collection
        # don't return anything

    def __exit__(self, exc_type, exc_value, traceback):
        # TODO: get rid of the explicit listing; see above
        for cls in [MultipleDatabaseModelDocument, session.Session]:
            cls._db_alias = self.connection_alias
            cls._collection = None  # clear any cached collection

    def to_pymongo(self):
        """"
        [deprecated]
        This is for temporary convenience, as all database access is migrated to models.

        This will be removed once the migration is complete, so please don't rely more than
        necessary upon it.

        Note that this returns a raw database object, which does not handle
        AutoReconnect exceptions.
        """
        self.register()
        # GridFS doesn't accept a MongoProxy, so return the raw object for now
        return get_db(self.connection_alias).__dict__['conn']


################################################################################
class Database(TileStore):
    """
    TODO: refactor this into MongoTileStore which stores image pyramid in
    mongodb collection
    """
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

    auth_db = StringField(required=False,
        verbose_name='Authentication Database', help_text='The database to authenticate against.')

    def get_tile(self, img, name):
        """
        Databases implementation of fetching tile
        """
        imgdb = self.to_pymongo()
        colImage = imgdb[img]
        docImage = colImage.find_one({'name':name})

        if docImage == None:
            raise Exception("Tile %s not found in %s"%(name,img))

        return str(docImage['file'])


