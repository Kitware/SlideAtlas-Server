import logging
logger = logging.getLogger("slideatlas.view.tile")
from flask import Blueprint, Response, abort, request
from slideatlas import models
from slideatlas import security

mod = Blueprint('tile', __name__)

@mod.route('/tile')
@security.login_required
def tile():
    """
    - /tile/4e695114587718175c000006/t.jpg  searches and returns the image
    """
    # Get variables
    image_id = request.args.get('img')
    image_store_id = request.args.get('db')
    tile_name = request.args.get('name')

    image_store = models.ImageStore.objects.get_or_404(id=image_store_id)
    try:
        tile_data = image_store.get_tile(image_id, tile_name)
        return Response(tile_data, mimetype="image/jpeg")
    except Exception as e:
        logger.error("Tile not loaded: %s"%(e.message))
        return Response("{\"error\" : \"Tile loading error: %s\"}"%(e.message), status=404)


@mod.route('/thumb')
@security.login_required
def thumb():
    """
    - /tile/4e695114587718175c000006/t.jpg  searches and returns the image
    """
    # Get variables
    image_id = request.args.get('img')
    image_store_id = request.args.get('db')
    tile_name = request.args.get('name')

    image_store = models.ImageStore.objects.get_or_404(id=image_store_id)
    # try:
    tile_data = image_store.get_thumb(image_id)
    return Response(tile_data, mimetype="image/jpeg")
    # except Exception as e:
    logger.error("Thumb not available: %s"%(e.message))
    return Response("{\"error\" : \"Thumb loading error: %s\"}"%(e.message), status=404)
