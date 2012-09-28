from flask import Blueprint, Response, abort

from pymongo import Connection


mod = Blueprint('tile', __name__)

@mod.route('/tile')
@mod.route('/tile/<img>/<name>')
def tile(img='4e695114587718175c000006', name='t.jpg'):
    """    
    - /tile/4e695114587718175c000006/t.jpg  searches and returns the image
    """
    # Connect with 
    conn = Connection("slide-atlas.org:27017")

    colImage = conn["bev1"][img]
    docImage = colImage.find_one({'name':name})
    if docImage == None:
        abort(403)
    return Response(str(docImage['file']), mimetype="image/jpeg")

