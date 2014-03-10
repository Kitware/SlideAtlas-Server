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
    img = request.args.get('img')
    db = request.args.get('db')
    name = request.args.get('name')

    if not models.User().is_authenticated():
        abort(403)

    database = models.Database.objects.get_or_404(id=db)
    imgdb = database.to_pymongo()
    colImage = imgdb[img]
    docImage = colImage.find_one({'name':name})

    if docImage == None:
        abort(404)
    return Response(str(docImage['file']), mimetype="image/jpeg")
