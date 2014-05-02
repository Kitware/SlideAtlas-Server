import logging
logger = logging.getLogger("slideatlas.view.tile")
from flask import Blueprint, Response, abort, request
from slideatlas import models
from slideatlas import security
from slideatlas.ptiffstore.common_utils import getcoords
from slideatlas.ptiffstore.reader_cache import make_reader
from slideatlas.models.image import Image
import os
import StringIO
import flask

mod = Blueprint('tile', __name__)

@mod.route('/tile')
@security.login_required
def tile():
    """
    - /tile/4e695114587718175c000006/t.jpg  searches and returns the image
    """
    # Get variables
    img = request.args.get('img')
    db = request.args.get('db')
    name = request.args.get('name')

    if not models.User().is_authenticated():
        abort(403)

    database = models.Database.objects.get_or_404(id=db)
    try:

        imgdata = database.get_tile(img, name)
        return flask.Response(imgdata, mimetype="image/jpeg")
    except Exception as e:
        logger.error("Tile not loaded: %s"%(e.message))
        return flask.Response("{\"error\" : \"Tile loading error: %s\"}"%(e.message), status=404)
