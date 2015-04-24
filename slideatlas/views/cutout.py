# coding=utf-8

import math
import cStringIO as StringIO

from flask import Blueprint, Response, request, current_app
import json
# from slideatlas import models#, security
from slideatlas.common_utils import jsonify
# from slideatlas.ptiffstore.tiff_reader import TileReader
from slideatlas import models

from PIL import Image


################################################################################
mod = Blueprint('cutout', __name__)

from slideatlas.core import logger

################################################################################
@mod.route('/cutout/<ObjectId:image_store_id>/<ObjectId:image_id>/<filename>', methods=["GET"])
# @security.login_required
def cutout(image_store_id, image_id, filename):
    """
    Returns a requested image assembled from the tiles

    to test fire following request from a view.

    $.ajax({
      type: "GET",
      url: "/cutout/5074589302e31023d4292d97/4f9b36c84834a3056400001b/image.png",
      data: {debug:0, bounds:JSON.stringify([0,500,0,500])},
      });

    or

    http://localhost:8080/cutout/5074589302e31023d4292d97/4f9b36c84834a3056400001b/image.png?some=other&bounds=%5B8498.331884204574%2C8806.831884204574%2C9438.890126159336%2C9919.390126159336%5D

    Accepts url paramters debug, and bounds which is json string of array of four bounds
    """
    # Accept parameters
    args = {}
    args["bounds"] = json.loads(request.args.get("bounds", "[]"))
    args["debug"] = int(request.args.get("debug", "0"))
    args["image_store"] = image_store_id
    args["image"] = image_id

    resp = {}
    resp["request"] = args

    if args["debug"]:
        return jsonify(resp)

    # Parameter checking
    if len(args["bounds"]) != 4:
        resp["error"] = "Expecting 4 coordinates of enclosing rectangle, x1, x2, y1, y2"
        return jsonify(resp)

    # Convert to intgers
    bounds = [int(coord) for coord in args["bounds"]]

    try:
        image_store = models.ImageStore.objects.get(id=image_store_id)
    except:
        resp["error"] = "Unable to access imagestore"
        return jsonify(resp)

    # Get the record of the image to know tilesize
    try:
        image_obj = image_store.get_image_metadata(image_id)
        resp["image_obj"] = image_obj
    except:
        resp["error"] = "Unable to access imagestore"
        return jsonify(resp)

    # Image properties
    tilesize = int(image_obj["TileSize"])
    base_level = image_obj["levels"] - 1  # as t.jpg is level 0

    # Round the bounds off to nearest tile boundaries
    tile_bounds = [int(math.floor(bounds[0] / tilesize)),
                   int(math.ceil(bounds[1] / tilesize)),
                   int(math.floor(bounds[2] / tilesize)),
                   int(math.ceil(bounds[3] / tilesize))
                   ]

    tile_cols = tile_bounds[1] - tile_bounds[0] + 1
    tile_rows = tile_bounds[3] - tile_bounds[2] + 1

    # Create image
    image = Image.new("RGB",
                      (tile_cols * tilesize, tile_rows * tilesize),
                      color="white")

    # Grab and paste tiles
    tiles = [(x + tile_bounds[0], y + tile_bounds[2]) for x in range(tile_cols) for y in range(tile_rows)]

    origin_x = tile_bounds[0] * tilesize
    origin_y = tile_bounds[2] * tilesize
    max_y = (tile_bounds[3]) * tilesize

    for atile in tiles:
        # Get the tile
        x = atile[0] * tilesize
        y = atile[1] * tilesize

        try:
            tile_in = image_store.get_tile_at(image_id, x, y, base_level, tilesize=tilesize)
            # current_app.logger.debug("x:%d, y:%d, z:%d" % (x, y, base_level))
            tile_buf = StringIO.StringIO(tile_in)
            tile_image = Image.open(tile_buf)
        except:
            tile_image = Image.new("RGB", (tilesize, tilesize), 'white')

        # Paste into the image
        # box = [left, upper, right, lower]
        box = [x - origin_x, y - origin_y, x + tilesize - origin_x, y + tilesize - origin_y]
        box[1] = max_y - box[1]
        box[3] = box[1] + tilesize

        image.paste(tile_image, box)
        try:
            tile_buf.close()
        except:
            pass

    # Compress and return the image
    buf = StringIO.StringIO()
    image.save(buf, format="jpeg")
    response = Response(content_type='image/jpeg')
    response.set_data(buf.getvalue())
    buf.close()
    response.headers["Content-Disposition"] = "attachment; filename=\"output.jpeg\";"
    # response.headers["Content-Transfer-Encoding"] = "binary"
    # header("Content-Length: ".filesize($filename));
    return response
