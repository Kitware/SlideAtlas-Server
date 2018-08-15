# coding=utf-8

from flask import Blueprint, Response, current_app, request, redirect

from slideatlas import models
from slideatlas.common_utils import jsonify

import base64
from bson import ObjectId

################################################################################
mod = Blueprint('tile', __name__)


################################################################################
@mod.route('/tile/<ObjectId:image_store_id>/<ObjectId:image_id>/<string:tile_name>')
# @security.login_required
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
    response.set_etag('%s-%s-v2' % (image_id, tile_name), weak=True)
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
# @security.login_required
def tile_query():
    image_store_id = request.args.get('db')
    image_id = request.args.get('img')
    tile_name = request.args.get('name')

    return tile(image_store_id, image_id, tile_name)


################################################################################
@mod.route('/thumb/<ImageStore:image_store>/<Image:image>')
# @security.login_required
def thumb(image_store, image, imageobj):
    """
    Return a thumbnail image
    """
    if imageobj and 'girder' in imageobj:
        server = imageobj['girder']['server']
        girderItemId = imageobj['girder']['itemId']
        girder_url = server + '/api/v1/item/' + str(girderItemId) + '/tiles/thumbnail?height=100'
        resp = Response('{"Location":%s}'%girder_url,status=301)
        resp.headers['Location'] = girder_url
        return resp

    # TODO: support Not Modified) responses, but only after thumbnails are
    #   moved out of ImageStores; thumbnails are mutable, so 2 database lookups
    #   will currently always have to be made
    try:
        tile_data = image_store.get_thumb(image)
        return Response(tile_data, mimetype='image/jpeg')
    except models.DoesNotExist as e:
        current_app.logger.warning('Thumb not available: %s' % e.message)
        return Response('{"error": "Thumb loading error: %s"}' % e.message, status=404)


################################################################################
@mod.route('/thumb')
# @security.login_required
def thumb_query():
    image_id = request.args.get('img')
    image_store_id = request.args.get('db')
    
    image_store = models.ImageStore.objects.get_or_404(id=image_store_id)
    with image_store:
        imagecol = models.Image._get_collection()
        try:
            imageobj = imagecol.find_one({"_id": ObjectId(image_id)})
        except:
            # TODO: more specific exception
            current_app.logger.warning('Bad image id: %s' % image_id)
            return Response('{"error": "Thumb loading error: %s"}' % image_id, status=404)
        image = models.Image.objects.get_or_404(id=image_id)

    return thumb(image_store, image, imageobj)


################################################################################
@mod.route('/label')
# @security.login_required
def label_query():
    image_id = request.args.get('img')
    image_store_id = request.args.get('db')
    
    image_store = models.ImageStore.objects.get_or_404(id=image_store_id)
    with image_store:
        imagecol = models.Image._get_collection()
        try:
            imageobj = imagecol.find_one({"_id": ObjectId(image_id)})
        except:
            # TODO: more specific exception
            current_app.logger.warning('Bad image id: %s' % image_id)
            return Response('{"error": "Thumb loading error: %s"}' % image_id, status=404)
        image = models.Image.objects.get_or_404(id=image_id)

    if imageobj and 'girder' in imageobj:
        server = imageobj['girder']['server']
        girderItemId = imageobj['girder']['itemId']
        girder_url = server + '/api/v1/item/' + str(girderItemId) + '/tiles/images/label?height=100'
        resp = Response('{"Location":%s}'%girder_url,status=301)
        resp.headers['Location'] = girder_url
        return resp
    else:
        resp = Response('{"Location":%s}'%'<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" width="0" height="0" alt="" />',status=301)
        resp.headers['Location'] = girder_url
        return resp


################################################################################
@mod.route('/viewthumb')
def thumb_from_view():
    """
    Gets a thumbnail from view directly,
    Chains the request to view objects helper method
    """

    # Get parameters
    viewid = ObjectId(request.args.get("viewid", None))
    # which = ObjectId(request.args.get("which","macro"))
    which = "macro"
    force = bool(request.args.get("force", False))

    # Implementation without View
    viewcol = models.View._get_collection()
    viewobj = viewcol.find_one({"_id": viewid})
    if "thumbs" not in viewobj:
        viewobj["thumbs"] = {}

    # Make thumbnail
    if force or which not in viewobj["thumbs"]:
        # Refresh the thumbnail
        if which not in ["macro"]:
            # Only know how to make macro image
            # Todo: add support for label supported
            raise Exception("%s thumbnail creation not supported" % which)

        # Make the thumb
        # Get the image store and image id and off load the request
        istore = models.ImageStore.objects.get(id=viewobj["ViewerRecords"][0]["Database"])
        with istore:
            thumbimgdata = istore.make_thumb(
                models.Image.objects.get(id=viewobj["ViewerRecords"][0]["Image"]))

            viewcol.update({"_id": viewid},
                           {"$set": {"thumbs." + which: base64.b64encode(thumbimgdata)}})

    viewobj = viewcol.find_one({"_id": viewid})
    imagestr = viewobj["thumbs"][which]
    # current_app.logger.warning("Imagestr: " + imagestr)

    if int(request.args.get("binary", 0)):
        return Response(base64.b64decode(imagestr), mimetype="image/jpeg")
    else:
        return jsonify({which: imagestr})


@mod.route('/view')
def view_from_viewid():
    """
    redirects to the glviewer endpoint
    """

    # Get parameters
    viewid = ObjectId(request.args.get("viewid", None))

    # Implementation without View
    viewcol = models.View._get_collection()
    viewobj = viewcol.find_one({"_id": viewid})

    return redirect("/webgl-viewer?db=%s&view=%s" % (viewobj["ViewerRecords"][0]["Database"], viewid), code=302)
