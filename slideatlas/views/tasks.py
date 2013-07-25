from flask import Blueprint, Response, abort, request, session, flash
from slideatlas import slconn as conn
from bson import ObjectId
from slideatlas import model, celery

""" Useful routines for task administration 
    might go in utils and may be imported from sessions view which initiates or find status of the included images
"""
mod = Blueprint('tasks', __name__)

def get_celery_worker_status():
    ERROR_KEY = "ERROR"
    try:
        from celery.task.control import inspect
        insp = inspect()
        d = insp.stats()
        if not d:
            d = { ERROR_KEY: 'No running Celery workers were found.' }
    except IOError as e:
        from errno import errorcode
        msg = "Error connecting to the backend: " + str(e)
        if len(e.args) > 0 and errorcode.get(e.args[0]) == 'ECONNREFUSED':
            msg += ' Check that the RabbitMQ server is running.'
        d = { ERROR_KEY: msg }
    except ImportError as e:
        d = { ERROR_KEY: str(e)}
    return d



@mod.route('status')
def status():
    """
    entry point for tasks related queries
    supposed to be allowed only to administers for debug purpose
    """

    flash("Worker found", "success")
    flash("No worker found ", "error")

    return Response(str(docImage['file']), mimetype="image/jpeg")

