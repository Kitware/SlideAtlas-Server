import os
import sys
import logging

slideatlaspath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(slideatlaspath)

from slideatlas.models.image import Image
from slideatlas.models import Database
from slideatlas.ptiffstore.asset_store import PtiffTileStore

def test_image_access():
    for obj in Database.objects(dbname="demo"):
        print obj._cls, obj.label
        with obj:
            for img in Image.objects():
                print img.label

if __name__ == "__main__":
    """
    Run few tests
    This class will be finally imported from tiff server
    """

    logging.getLogger().setLevel(logging.INFO)

    # This is required so that model gets registered
    from slideatlas import create_app
    app = create_app()

    # test_ptiff_tile_store()
    # create_ptiff_store()
    # test_getlist()
    # test_items_mongoengine()
    # test_modify_store()
    test_image_access()
    test_images_from_database()
