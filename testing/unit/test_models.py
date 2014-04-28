import os
import sys
import logging
from bson import ObjectId

logging.basicConfig(level=logging.INFO)

slideatlaspath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(slideatlaspath)

from slideatlas.models import Image
from slideatlas.models import Database, View, Session
from slideatlas.ptiffstore.asset_store import PtiffTileStore

def test_image_access():
    obj = Database.objects(dbname="demo")[0]
    assert(obj != None)

    print obj._cls, obj.label
    with obj:
        img = Image.objects()[2]
        assert(img!=None)
        logger.info("Found image labelled %s"%(img.label))

def test_view_access():
    obj = Database.objects(dbname="demo")[0]
    assert(obj != None)

    print obj._cls, obj.label
    with obj:
        aview = View.objects(image=ObjectId("4e6ec90183ff8d11c8000001"))[0]
        assert(aview != None)
        logger.info("Found view :  %s"%(str(aview.__dict__)))



def test_sess_access():
    obj = Database.objects(dbname="ptiffayodhya")[0]
    assert(obj != None)

    print obj._cls, obj.label
    with obj:
        asess = Session.objects.first()
        assert(asess != None)
        logger.info("Found sess :  %s"%(str(asess.__dict__)))



if __name__ == "__main__":
    """
    Run few tests
    This class will be finally imported from tiff server
    """

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # This is required so that model gets registered
    from slideatlas import create_app
    app = create_app()

    # test_ptiff_tile_store()
    # create_ptiff_store()
    # test_getlist()
    # test_items_mongoengine()
    # test_modify_store()
    # test_image_access()
    # test_view_access()
    test_sess_access()
