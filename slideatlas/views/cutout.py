# coding=utf-8

import math
import cStringIO as StringIO
import datetime
import time

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
    # resp["request"] = args

    # Parameter checking
    if len(args["bounds"]) != 4:
        resp["error"] = "Expecting 4 coordinates of enclosing rectangle, x1, x2, y1, y2"
        return jsonify(resp)

    # Convert to intgers
    bounds = [int(coord) for coord in args["bounds"]]

    try:
        image_store = models.ImageStore.objects.get(id=image_store_id)
        # resp["image_store"] = image_store.to_mongo()
    except:
        resp["error"] = "Unable to access imagestore"
        return jsonify(resp)

    # Get the record of the image to know tilesize
    try:
        image_obj = image_store.get_image_metadata(image_id)
        # resp["image_obj"] = image_obj
    except:
        resp["error"] = "Unable to access imagestore"
        return jsonify(resp)

    # Interprete the bounds
    coordinate_system = image_obj.get("CoordinateSystem", "Pixel")
    resp["coordinate_system"] = coordinate_system

    # Swap the higher number
    if coordinate_system == "Pixel":
        bounds[3], bounds[2] = image_obj["bounds"][3]-bounds[2], image_obj["bounds"][3]-bounds[3]

    # Subtract 1 from the x2 and y2 to not leak into next tiles
    bounds[1] = bounds[1] - 1
    bounds[3] = bounds[3] - 1

    resp["bounds"] = bounds

    # Image properties
    tilesize = int(image_obj["TileSize"])
    base_level = image_obj["levels"] - 1  # as t.jpg is level 0

    # Round the bounds off to nearest tile boundaries
    # TODO: Assert that client is doing it for us
    tile_bounds = [int(math.floor(float(bounds[0]) / tilesize)),
                   int(math.ceil(float(bounds[1]) / tilesize))-1,
                   int(math.floor(float(bounds[2]) / tilesize)),
                   int(math.ceil(float(bounds[3]) / tilesize)-1)
                   ]

    # tile_bounds = [1,1,1,1]

    resp["tile_bounds"] = tile_bounds

    tile_cols = tile_bounds[1] - tile_bounds[0] + 1
    tile_rows = tile_bounds[3] - tile_bounds[2] + 1

    resp["tile_grid"] = tile_cols, tile_rows

    # Create image
    image = Image.new("RGB",
                      (tile_cols * tilesize, tile_rows * tilesize),
                      color="white")

    # Grab and paste tiles
    tiles = [(x + tile_bounds[0], y + tile_bounds[2]) for x in range(tile_cols) for y in range(tile_rows)]

    resp["tiles"] = tiles

    origin_x = tile_bounds[0] * tilesize
    origin_y = tile_bounds[2] * tilesize
    height = (tile_bounds[3]-tile_bounds[2]) * tilesize

    # Global origin in the coordinate system of the image
    # For the region requested

    resp["origins"] = {"origin_x": origin_x,
                       "origin_y": origin_y,
                       "height": height}

    resp["boxes"] = []

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
        box = [x - origin_x,
               y - origin_y,
               x - origin_x + tilesize,
               y - origin_y + tilesize]

        # Account for the flipped y axis of the PIL
        box[1] = height - box[1]
        box[3] = box[1] + tilesize

        resp["boxes"].append(box)
        image.paste(tile_image, box)
        try:
            tile_buf.close()
        except:
            pass

    if args["debug"]:
        resp["url"] = request.base_url+"?bounds=" + json.dumps(args["bounds"]).replace(" ","")
        return jsonify(resp)


    # Compress and return the image
    buf = StringIO.StringIO()
    image.save(buf, format="jpeg")
    response = Response(content_type='image/jpeg')
    response.set_data(buf.getvalue())
    buf.close()

    # Set filename
    timestamp = datetime.datetime.fromtimestamp(time.time()).strftime('%Y%m%d-%H%M%S')
    response.headers["Content-Disposition"] = "attachment; filename=\"cutout_" + timestamp + ".jpeg\";"
    # response.headers["Content-Transfer-Encoding"] = "binary"
    # header("Content-Length: ".filesize($filename));
    return response
