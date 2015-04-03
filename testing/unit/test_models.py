import os
import sys
import logging
from bson import ObjectId

logging.basicConfig(level=logging.INFO)

slideatlaspath = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.append(slideatlaspath)

from slideatlas import models
from slideatlas.models import Image
from slideatlas.models import ImageStore, View, Session

import base64

def test_image_access():
    obj = ImageStore.objects(dbname="demo")[0]
    assert(obj != None)

    print obj._cls, obj.label
    with obj:
        img = Image.objects()[2]
        assert(img!=None)
        logger.info("Found image labelled %s"%(img.label))

def test_view_access():
    obj = ImageStore.objects(dbname="demo")[0]
    assert(obj != None)

    print obj._cls, obj.label
    with obj:
        aview = View.objects(image=ObjectId("4e6ec90183ff8d11c8000001"))[0]
        assert(aview != None)
        logger.info("Found view :  %s"%(str(aview.__dict__)))



def test_sess_access():
    obj = ImageStore.objects(dbname="ptiffayodhya")[0]
    assert(obj != None)

    print obj._cls, obj.label
    with obj:
        asess = Session.objects.first()
        assert(asess != None)
        logger.info("Found sess :  %s"%(str(asess.__dict__)))


def test_collection_access():
    """ Snippet to test collection access """
    all_collections_query = models.Collection.objects\
        .no_dereference()

    can_admin_collections = all_collections_query.can_access(models.Operation.admin)

    for col in all_collections_query:
        print col.label


def test_and_fix__macro_thumbs():
    # params
    viewcol = View._get_collection()
    which = "macro"
    force = False

    made = 0
    errored = 0
    skipped = 0
    total = 0

    for viewobj in viewcol.find():
        total = total + 1
        logger.info("Total: %d" % total)
        try:
            # Make thumbnail
            if "thumbs" not in viewobj:
                viewobj["thumbs"] = {}

            if force or which not in viewobj["thumbs"]:

                # Refresh the thumbnail
                if which not in ["macro"]:
                    # Only know how to make macro image
                    # Todo: add support for label supported
                    raise Exception("%s thumbnail creation not supported" % which)

                # Make the macro thumb
                # Get the image store and image id and off load the request
                istore = models.ImageStore.objects.get(id=viewobj["ViewerRecords"][0]["Database"])

                # All image stores support macro thumb
                with istore:
                    thumbimgdata = istore.make_thumb(
                        models.Image.objects.get(id=viewobj["ViewerRecords"][0]["Image"]))

                    viewcol.update({"_id": viewobj["_id"]},
                        {"$set" : { "thumbs." + which: base64.b64encode(thumbimgdata)}})

                    made = made + 1
                    logger.info("Made: %d" % made)
            else:
                skipped = skipped + 1
                logger.info("Skipped: %d" % skipped)

        except Exception as e:
            errored = errored + 1
            logger.info("Errored: %d, %s" % (errored, e.message))

    logger.info("Made: %d" % made)
    logger.info("Skipped: %d" % skipped)
    logger.info("Errored: %d" % errored)

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
    # test_sess_access()
    # test_collection_access()
    with app.app_context():
        test_and_fix__macro_thumbs()
