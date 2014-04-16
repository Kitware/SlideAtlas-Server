from flask import Blueprint, Response, abort, request
from slideatlas import models
from slideatlas import security
from slideatlas.ptiffstore.common_utils import getcoords
from slideatlas.ptiffstore.reader_cache import make_reader
from slideatlas.models.image import Image
import os
import logging
import StringIO
import flask

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

    if database._cls == "TileStore.Database.PtiffTileStore":
        with database:
            img = Image.objects.get_or_404(id=img)

        tiffpath = os.path.join(database.root_path, img.filename)

        [x, y, z] = getcoords(name[:-4])

        reader = make_reader({"fname" : tiffpath, "dir" : img.levels - z -1})
        logging.log(logging.INFO, "Viewing fname: %s" % (tiffpath))

        # Locate the tilename from x and y

        locx = x * 512 + 5
        locy = y * 512 + 5

        # if reader.dir != z:
        #     reader.select_dir(z)
        #     logging.log(logging.ERROR, "Switched to %d zoom"%(reader.dir))

        fp = StringIO.StringIO()
        r = reader.dump_tile(locx,locy, fp)

        try:
            r = reader.dump_tile(locx,locy, fp)
            if r > 0:
                logging.log(logging.ERROR, "Read %d bytes"%(r))
            else:
                raise Exception("Tile not read")

        except Exception as e:
            #docIma ge = colImage.find_one({'name': get_tile_name_slideatlas(x,y,z)})
            logging.log(logging.ERROR, "Tile not loaded: %s"%(e.message))
            fp.close()
            return flask.Response("{\"error\" : \"resource not found\"}" , status=405)

        #s = fp.getvalue()
        #logging.log(logging.ERROR, "Got %d bytes in buffer"%(len(s)))
        # fp2 = open("test_output.jpg","wb")
        # fp2.write(fp.getvalue())
        # fp2.close()
        return flask.Response(fp.getvalue(), mimetype="image/jpeg")

    imgdb = database.to_pymongo()
    colImage = imgdb[img]
    docImage = colImage.find_one({'name':name})

    if docImage == None:
        abort(404)
    return Response(str(docImage['file']), mimetype="image/jpeg")
