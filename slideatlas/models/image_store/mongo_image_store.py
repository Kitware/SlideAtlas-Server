# coding=utf-8

from mongoengine import DoesNotExist

from .image_store import MultipleDatabaseImageStore
from slideatlas.ptiffstore.common_utils import get_tile_name_slideatlas
from flask import current_app
################################################################################
__all__ = ('MongoImageStore',)


################################################################################
class MongoImageStore(MultipleDatabaseImageStore):
    """
    """

    def get_tile_at(self, image_id, x, y, z, tilesize=256):
        """
        Returns tile at the given location in the pyramid
        need to divide by the tilesize
        """
        tile_name = get_tile_name_slideatlas(x / tilesize, y / tilesize, z)
        current_app.logger.debug("TileName: %s" % tile_name)
        return self.get_tile(image_id, tile_name)

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

    def get_thumb(self, image):
        # TODO: Attempt to create 't.jpg' if does not exist
        return self.get_tile(image.id, 't.jpg')

    def remove_image(self, image_id):
        """
        Removes the image record and corresponding image collection
        TODO: decide the strategy for orphaned views
        """
        image_database = self.to_pymongo()

        # Attempt to remove the image record and collection
        image_database['images'].remove({'_id': image_id})
        image_database.drop_collection(str(image_id))

