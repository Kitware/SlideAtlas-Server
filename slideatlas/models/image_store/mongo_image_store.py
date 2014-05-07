# coding=utf-8

from mongoengine import DoesNotExist

from .image_store import ImageStore, MultipleDatabaseImageStoreMixin

################################################################################
__all__ = ('MongoImageStore', 'Database')


################################################################################
class MongoImageStore(ImageStore, MultipleDatabaseImageStoreMixin):
    """
    """

    def get_tile(self, image_id, tile_name):
        """
        """
        # TODO: accept an Image object too
        image_id = str(image_id)

        image_database = self.to_pymongo()
        image_tiles_collection = image_database[image_id]
        tile_doc = image_tiles_collection.find_one({'name': tile_name})

        if not tile_doc:
            raise DoesNotExist('Tile "%s" not found in image %s' % (tile_name, image_id))

        return str(tile_doc['file'])


################################################################################
# TODO: 'Database' is deprecated, but still in lots of existing code
Database = MongoImageStore
