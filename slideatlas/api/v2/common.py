# coding=utf-8

from flask.ext.restful import abort as restful_abort
from flask.ext.restful.utils import error_data

################################################################################
__all__ = ()


################################################################################
#TODO
# from flask.json import JSONDecoder

def abort(http_status_code, details=None):
    """
    Return an error response, with the given 'http_status_code' and a JSON body.

    Optionally, supplemental 'details' may be provided, which will be included
    with the response body.

    This function provides the same {'status', 'message'} response body as
    Flask-Restful, but also allows an optional 'details' field to be added.
    """
    data = error_data(http_status_code)
    if details:
        data['details'] = details
    restful_abort(http_status_code, **data)
