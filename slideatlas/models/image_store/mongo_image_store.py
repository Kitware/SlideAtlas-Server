# coding=utf-8

from mongoengine import DoesNotExist

from .image_store import MultipleDatabaseImageStore

################################################################################
__all__ = ('MongoImageStore',)


################################################################################
class MongoImageStore(MultipleDatabaseImageStore):
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


    def get_thumb(self, image_id):
        return self.get_tile(image_id, "t.jpg")
