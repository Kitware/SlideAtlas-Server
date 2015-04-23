# coding=utf-8

import cStringIO as StringIO

from flask import Blueprint, Response, request

# from slideatlas import models#, security
# from slideatlas.common_utils import jsonify

# from bson import ObjectId

from PIL import Image

################################################################################
mod = Blueprint('cutout', __name__)


################################################################################
@mod.route('/cutout/<ObjectId:image_store_id>/<ObjectId:image_id>/<filename>', methods=["POST", "GET"])
# @security.login_required
def cutout(image_store_id, image_id, filename):
    """
    Returns a requested image assembled from the tiles
    """

    # [2945.9990747679594, 12810.181002457713, 6757.830888050663, 14886.255480825053]
    x = filename
    image = Image.new("RGB", (100, 100), color="red")

    buf = StringIO.StringIO()
    image.save(buf, format="jpeg")
    response = Response(content_type='image/jpeg')
    response.set_data(buf.getvalue())
    buf.close()
    return response
