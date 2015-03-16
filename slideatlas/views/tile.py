# coding=utf-8

from flask import Blueprint, Response, current_app, request

from slideatlas import models, security

################################################################################
mod = Blueprint('tile', __name__)


################################################################################
@mod.route('/tile/<ObjectId:image_store_id>/<ObjectId:image_id>/<string:tile_name>')
#@security.login_required
def tile(image_store_id, image_id, tile_name):
    """
    Return a tile image.

    Note that the 'image_store' and 'image_id' URL parameters are accepted as
    an ObjectIds, to prevent unnecessary database queries if HTTP caching
    causes a 304 (Not Modified) response to be returned.
    """
    response = Response(content_type='image/jpeg')
    # tiles could change, especially if PTIFFs are rebuilt, so mark the ETag as
    #   weak
    # TODO: could we ensure that tiles are immutable?
    response.set_etag('%s-%s' % (image_id, tile_name), weak=True)
    response.cache_control.public = True
    # since Last Modified is not used, and the ETag is weak, setting a max-age
    #   is important, so clients don't cache tiles too long
    response.cache_control.max_age = current_app.get_send_file_max_age(None)
    # Last Modified is not strictly required, per RFC 2616 14.29, and setting
    #   it accurately would require a database query; by leaving it unset,
    #   user agents will use only If-None-Match with ETags for cache validation

    response.make_conditional(request)
    if response.status_code != 304:  # Not Modified
        image_store = models.ImageStore.objects.get_or_404(id=image_store_id)
        try:
            tile_data = image_store.get_tile(image_id, tile_name)
        except models.DoesNotExist as e:
            # TODO: more specific exception
            current_app.logger.warning('Tile not loaded: %s' % e.message)
            return Response('{"error": "Tile loading error: %s"}' % e.message, status=404)
        response.set_data(tile_data)

    return response


@mod.route('/tile')
#@security.login_required
def tile_query():
    image_store_id = request.args.get('db')
    image_id = request.args.get('img')
    tile_name = request.args.get('name')

    return tile(image_store_id, image_id, tile_name)


################################################################################
@mod.route('/thumb/<ImageStore:image_store>/<Image:image>')
#@security.login_required
def thumb(image_store, image):
    """
    Return a thumbnail image
    """
    # TODO: support Not Modified) responses, but only after thumbnails are
    #   moved out of ImageStores; thumbnails are mutable, so 2 database lookups
    #   will currently always have to be made
    try:
        tile_data = image_store.get_thumb(image)
        return Response(tile_data, mimetype='image/jpeg')
    except models.DoesNotExist as e:
        current_app.logger.warning('Thumb not available: %s' % e.message)
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
