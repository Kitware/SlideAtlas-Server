from flask import Blueprint, Response

from pymongo import Connection
from bson import ObjectId

mod = Blueprint('tile', __name__)

@mod.route('/tile/<img>/<name>')
def tile(img='4e695114587718175c000006', name='t.jpg'):
    """    
    - /tile/4e695114587718175c000006/t.jpg  searches and returns the image
    """
    # Connect with 
    conn = Connection("ayodhya:27017")

    colImage = conn["demo"][img]
    docImage = colImage.find_one({'name':name})
    return Response(str(docImage['file']), mimetype="image/jpg")

