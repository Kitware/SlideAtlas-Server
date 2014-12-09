# coding=utf-8

import logging
logger = logging.getLogger('slideatlas')

from slideatlas.models import ImageStore, PtiffImageStore
from slideatlas.models import ImageStore as TileStore


# class PhilipsImageMixin(object):
#     """
#     Methods and business logic for ptiff images coming from philips
#     """
#     pass

# class PhilipsImage(Image, PhilipsImageMixin):
#     """
#     Data models for ptiff images based on mongoengine
#     """

#     barcode = StringField(required=True, #TODO: filename with respect to root_path
#         verbose_name='Barcode', help_text='Bar code string')


def test_ptiff_tile_store():
    store = PtiffImageStore(root_path="/home/dhan/data/phillips")
    logger.info('Last sync on initialization: %s', store.last_sync)
    # logger.debug('%s', store.root_path)
    store.sync()
    logger.info('Last sync after sync: %s', store.last_sync)

def test_modify_store():
    for obj in PtiffImageStore.objects:
        logger.info('Synchronizing ptiff store: %s', obj.label)
        obj.resync()


def create_ptiff_store():
    store = PtiffImageStore(root_path="/home/dhan/data/phillips",
        label="Philips Scanner folder from wsiserver3",
        copyright="Copyright &copy; 2011-13, Charles Palmer, Beverly Faulkner-Jones and Su-jean Seo. All rights reserved.")

    # logger.debug('%s', store.__dict__)
    store.save()

def test_getlist():
    """
    .. code-block:: javascript

        db.databases.update({"_cls" : {"$exists" : 0}},{"$set" : { "_cls" : "TileStore.Database"}}, {"multi" : true })

    """


    # logger.debug('getting list')

    # # Getting user list works perfectly
    # for obj in User.objects():
    #     logger.debug('%s', obj)

    # Getting user list works perfectly
    # for obj in ImageStore.objects:
    #     logger.debug('Gotit')
    #     logger.debug('%s', obj)

    # for obj in TileStore.objects():
    #     logger.debug('%s', obj)

def test_items_mongoengine():
    pass
    # .with_id(ObjectId("53482d5a0a3ee1346135d805"))
    # logger.debug('TileStore')
    # for obj in TileStore.objects:
    #     logger.debug('%s %s', obj._cls, obj.label)
    # logger.debug('Database')
    # for obj in ImageStore.objects:
    #     logger.debug('%s %s', obj._cls, obj.label)
    #
    # logger.debug('PtiffTileStore')
    # for obj in PtiffImageStore.objects:
    #     logger.debug('%s %s', obj._cls, obj.label)



if __name__ == "__main__":
    """
    Run few tests
    This class will be finally imported from tiff server
    """
    # This is required so that model gets registered
    from slideatlas import create_app
    app = create_app()

    # test_ptiff_tile_store()
    # create_ptiff_store()
    # test_getlist()
    # test_items_mongoengine()
    test_modify_store()
