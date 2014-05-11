# coding=utf-8

import logging

from flask import Blueprint, Response, request

from slideatlas import models, security

################################################################################
mod = Blueprint('tile', __name__)
logger = logging.getLogger("slideatlas.view.tile")


################################################################################
@mod.route('/tile/<ImageStore:image_store>/<ObjectId:image_id>/<string:tile_name>')
@security.login_required
def tile(image_store, image_id, tile_name):
    """
    Return a tile image.

    Note that the 'image_id' URL parameter is accepted as an ObjectId for extra
    efficiency, preventing an unnecessary database query, although it should
    still reference a valid Image.
    """
    try:
        tile_data = image_store.get_tile(image_id, tile_name)
        return Response(tile_data, mimetype='image/jpeg')
    except Exception as e:
        # TODO: more specific exception
        logger.error('Tile not loaded: %s' % e.message)
        return Response('{"error": "Tile loading error: %s"}' % e.message, status=404)


@mod.route('/tile')
@security.login_required
def tile_query():
    image_store_id = request.args.get('db')
    image_id = request.args.get('img')
    tile_name = request.args.get('name')

    image_store = models.ImageStore.objects.get_or_404(id=image_store_id)

    return tile(image_store, image_id, tile_name)


################################################################################
@mod.route('/thumb/<ImageStore:image_store>/<Image:image>')
@security.login_required
def thumb(image_store, image):
    """
    Return a thumbnail image
    """
    # try:
    tile_data = image_store.get_thumb(image)
    return Response(tile_data, mimetype='image/jpeg')
    # except Exception as e:
    logger.error('Thumb not available: %s' % e.message)
    return Response('{"error": "Thumb loading error: %s"}' % e.message, status=404)


@mod.route('/thumb')
@security.login_required
def thumb_query():
    image_id = request.args.get('img')
    image_store_id = request.args.get('db')

    image_store = models.ImageStore.objects.get_or_404(id=image_store_id)
    with image_store:
        image = models.Image.objects.get_or_404(id=image_id)

    return thumb(image_store, image)
