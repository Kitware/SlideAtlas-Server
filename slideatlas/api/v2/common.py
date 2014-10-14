# coding=utf-8

from flask import current_app, make_response, request
from flask.json import dumps
from flask.ext.restful import abort as restful_abort
from flask.ext.restful.utils import error_data

################################################################################
__all__ = ()


################################################################################
def output_json(data, code, headers):
    if isinstance(data, (dict, list)):
        indent = None
        if current_app.config['JSONIFY_PRETTYPRINT_REGULAR'] and not request.is_xhr:
            indent = 2
        data = dumps(data, indent=indent)
    elif data is None:
        if code == 204:
            # make_response requires a string
            data = ''
        else:
            # clients will generally not accept an empty string as a valid
            #   JSON response body for non-204 codes
            data = '{}'
    else:
        raise ValueError('data is expected to be a dict, list, or None')

    return make_response(data, code, headers)


################################################################################
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
