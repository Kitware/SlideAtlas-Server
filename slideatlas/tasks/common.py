# common.py
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")
from slideatlas import create_celery_app
from slideatlas import create_app

import time

# Create the application objects
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
            d = {ERROR_KEY: 'No running Celery workers were found.'}
    except IOError as e:
        from errno import errorcode
        msg = "Error connecting to the brocker: " + str(e)
        if len(e.args) > 0 and errorcode.get(e.args[0]) == 'ECONNREFUSED':
            msg += ' Check that the RabbitMQ server is running.'
        d = {ERROR_KEY: msg}
    except ImportError as e:
        d = {ERROR_KEY: str(e)}
    return {"stats": d, "registered": r}


@celeryapp.task()
def process_for_time(a):
    for i in range(a):
        time.sleep(1)
        metastr = str({'current': i, 'total': a})
        celeryapp.current_task.update_state(state='PROGRESS', meta=metastr)
        print metastr
    return a
