# coding=utf-8

import logging

from flask import Blueprint, Response, request
from slideatlas import models, security
import time

################################################################################
mod = Blueprint('tile', __name__)
logger = logging.getLogger("slideatlas.view.tile")


################################################################################
@mod.route('/tile/<ImageStore:image_store>/<ObjectId:image_id>/<string:tile_name>')
#@security.login_required
def tile(image_store, image_id, tile_name):
    """
    Return a tile image.

    Note that the 'image_id' URL parameter is accepted as an ObjectId for extra
    efficiency, preventing an unnecessary database query, although it should
    still reference a valid Image.
    """
    header_etag = request.headers.get("If-None-Match") 

    if header_etag == str(image_store.id):
        # print "MATCH: ", header_etag
        return Response("",status=304)

    try:
        tile_data = image_store.get_tile(image_id, tile_name)
        response = Response(tile_data, mimetype='image/jpeg')
        response.cache_control.max_age = 12345
        response.set_etag(str(image_store.id))
        response.expires = time.time() + 12345
        response.make_conditional(request)
        response.headers["Cache-Control"] = "public, max-age=12345"
        return response
    except models.DoesNotExist as e:
        # TODO: more specific exception
        logger.warning('Tile not loaded: %s' % e.message)
        return Response('{"error": "Tile loading error: %s"}' % e.message, status=404)


@mod.route('/tile')
#@security.login_required
def tile_query():
    image_store_id = request.args.get('db')
    image_id = request.args.get('img')
    tile_name = request.args.get('name')

    image_store = models.ImageStore.objects.get_or_404(id=image_store_id)

    return tile(image_store, image_id, tile_name)


################################################################################
@mod.route('/thumb/<ImageStore:image_store>/<Image:image>')
#@security.login_required
def thumb(image_store, image):
    """
    Return a thumbnail image
    """
    try:
        tile_data = image_store.get_thumb(image)
        return Response(tile_data, mimetype='image/jpeg')
    except models.DoesNotExist as e:
        logger.error('Thumb not available: %s' % e.message)
        return Response('{"error": "Thumb loading error: %s"}' % e.message, status=404)


@mod.route('/thumb')
#@security.login_required
def thumb_query():
    image_id = request.args.get('img')
    image_store_id = request.args.get('db')

    image_store = models.ImageStore.objects.get_or_404(id=image_store_id)
    with image_store:
        image = models.Image.objects.get_or_404(id=image_id)

    return thumb(image_store, image)
