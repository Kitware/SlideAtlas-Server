__author__ = 'dhan'

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")

import logging
logger = logging.getLogger("tasks.autosync")

from .common import flaskapp, celeryapp


@celeryapp.task()
def sync_store(tilestore_id):
    from slideatlas.models import ImageStore
    from bson import ObjectId
    obj = ImageStore.objects.with_id(ObjectId(tilestore_id))

    if obj is None:
        # Invalid request the ImageStore is not found
        return {"error": "Tilestore Not found: %s" % tilestore_id}

    if obj._cls != "ImageStore.MultipleDatabaseImageStore.PtiffImageStore":
        return {"error": "Sync for %s is not defined" % obj._cls}

    # Request synchronization
    resp = {}
    with flaskapp.app_context():
        resp["syncresults"] = obj.sync()
        resp["database"] = obj.to_mongo()

    # Until we configure a different serializer
    resp["database"]["_id"] = str(resp["database"]["_id"])
    resp["database"]["last_sync"] = str(resp["database"]["last_sync"])
    logger.info(str(resp))
    return resp

