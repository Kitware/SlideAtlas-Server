__author__ = 'dhan'


import os
from celery import Celery
from celery.task.control import inspect
from celery.result import AsyncResult
import time
import sys
import json

import logging
logger = logging.getLogger("slideatlas.tasks")

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")
from slideatlas import create_celery_app
from slideatlas  import create_app 

# Create teh application objects 
flaskapp = create_app()
celeryapp = create_celery_app(flaskapp)



def get_celery_worker_status():
    """
    Returns a dictionary of all registered workers at the current broker and their status
    """
    ERROR_KEY = "ERROR"
    try:
        insp = celeryapp.control.inspect()
        d = insp.stats()
        r = insp.registered()
        insp.active()
        if not d:
            d = { ERROR_KEY: 'No running Celery workers were found.' }
    except IOError as e:
        from errno import errorcode
        msg = "Error connecting to the brocker: " + str(e)
        if len(e.args) > 0 and errorcode.get(e.args[0]) == 'ECONNREFUSED':
            msg += ' Check that the RabbitMQ server is running.'
        d = { ERROR_KEY: msg }
    except ImportError as e:
        d = { ERROR_KEY: str(e)}
    return {"stats" : d, "registered" : r}


@celeryapp.task()
def process_for_time(a):
    for i in range(a):
        time.sleep(1)
        metastr = str({'current': i, 'total': a})
        celeryapp.current_task.update_state(state='PROGRESS', meta=metastr)
        print metastr
    return a


@celeryapp.task()
def sync_store(tilestore_id):
    from slideatlas.models import ImageStore
    from slideatlas.api.api import DatabaseAPI
    from bson import ObjectId
    obj = ImageStore.objects.with_id(ObjectId(tilestore_id))

    if obj == None:
        # Invalid request the ImageStore is not found
        return { "error" : "Tilestore Not found: %s"%(tilestore_id) }
 
    if obj._cls != "ImageStore.MultipleDatabaseImageStore.PtiffImageStore":
        return {"error" : "Sync for %s is not defined"%(obj._cls) }

    # Request synchronization
    resp = {}
    resp["syncresults"] = obj.sync()
    resp["database"] = obj.to_mongo()

    # Until we configure a different serializer 
    resp["database"]["_id"] = str(resp["database"]["_id"])
    resp["database"]["last_sync"] = str(resp["database"]["last_sync"])    
    logger.info(str(resp))
    return resp

