import os
import sys
import cStringIO as StringIO

from . import TileReader
from . import MongoUploader

import logging
logging.basicConfig()
rootLogger = logging.getLogger()
logger = logging.getLogger("wrapper_uploader")
logger.setLevel(logging.INFO)

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")

# from slideatlas.models import Collection, Session
# from slideatlas.models import Image
# from bson import ObjectId
from bson import Binary
# import pymongo

from slideatlas.ptiffstore.common_utils import get_max_depth, get_tile_name_slideatlas

__all__ = ('MongoUploaderPtiff', )

class MongoUploaderPtiff(MongoUploader):
    """
    Class for uploading ptif tiles into mongodb collection
    """
    def make_reader(self):
        """
        Creates a ptif reader
        """
        try:
            reader = TileReader()
            reader.set_input_params({"fname": self.args["input"]})

            # Introspect
            logger.info("Dimensions: (%d, %d)" % (reader.width, reader.height))
            reader.parse_image_description()
            logger.info("Tilesize: %d, NoTiles: %d" % (reader.tile_width, reader.num_tiles))
        except:
            logger.error("Fatal Error: Unable to read input file %s" % (self.args["input"]))
            return -1

        return reader

    def __init__(self, args):
        """
        Expects -

            input
            imagestore
            collection
            tilesize
            mongo-collection
            force
            dry-run
            verbose
            parallel

        """

        super(MongoPtifUploader, self).__init__(args)

        # Check the input
        # TODO: Whether the input is a url
        # input is a slideatlas endpoint if "https://slide-atlas.org/api/v2/sessions/53cd6a5c81652c3a70d89976/attachments/53ce8f8fdd98b56dcb926d01"
        logger.error("Fatal error this implementation NEEDS A REVIEW, TODO: Use methods from base class ")
        sys.exit(-1)

        # fname = os.path.split(self.args.input)[1]
        # # Get the destination session in the collection
        # # try:
        # with self.flaskapp.app_context():
        #     # Locate the session
        #     coll = Collection.objects.get(id=ObjectId(self.args.collection))
        #     print "collection: ", coll.to_son()
        #     imagestore = coll.image_store
        #     print "imagestore: ", imagestore.to_son()
        #     session = Session.objects.get(id=ObjectId(self.args.session))
        #     print "session: ", session
        # # except Exception as e:
        # #     logger.error("Fatal Error: %s"%(e.message))
        # #     return -1
        # # Create image record
        # with self.flaskapp.app_context():
        #     with imagestore:
        #         if self.args.mongo_collection:
        #             try:
        #                 Image.objects.get(id=imageid)
        #                 Image.objects.remove(id=imageid)
        #             except:
        #                 # As expected
        #                 pass
        #
        #         image_doc = Image()
        #         image_doc["filename"] = fname
        #         image_doc["label"] = fname
        #         image_doc["origin"] = [0, 0, 0]
        #         image_doc["spacing"] = [1.0, 1.0, 1.0]  # TODO: Get it from the data
        #         image_doc["dimensions"] = [reader.width, reader.height]
        #         image_doc["bounds"] = [0, reader.width, 0, reader.height]
        #         image_doc["levels"] = len(reader.levels)
        #         image_doc["components"] = 3 # TODO: Get it from the data
        #         image_doc["metadataready"] = True
        #         image_doc["id"] = imageid
        #
        # # Upload the base
        # try:
        #     if imagestore.replica_set:
        #         conn = pymongo.ReplicaSetConnection(imagestore.host, replicaSet=imagestore.replica_set)
        #         db = conn[imagestore.dbname]
        #         db.authenticate(imagestore.username, imagestore.password)
        # except:
        #     logger.error("Fatal Error: Unable to connect to imagestore for inserting tiles")
        #     return -1
        # if self.args.mongo_collection:
        #     #Check whether the collection exists
        #     # Removing the collections
        #     if self.args.dry_run:
        #         logger.info("Dry run .. not removing original image chunks")
        #     else:
        #         db.drop_collection(self.args.mongo_collection)
        #
        # if self.args.base_only:
        #     self.upload_level(reader, db, imageid, level=0, dry_run=self.args.dry_run)
        # else:
        #     # Get the number of levels
        #     for i in range(len(reader.levels)):
        #         self.upload_level(reader, db, imageid, level=i, dry_run=self.args.dry_run)
        #
        # # # Temp for testing
        # # # Insert the record in the session
        # # imageid = ObjectId("53d0a1010a3ee130811cc5df")
        # # new_view_id = ObjectId("53d0a4da0a3ee1316edaa5aa")
        #
        # if self.args.dry_run:
        #     logger.info("Exiting .. dry run .. so no view or session update")
        #     return
        #
        # # Create a view
        # colviews = db["views"]
        # new_view_id = ObjectId()
        # colviews.insert({"img" : ObjectId(imageid) ,  "_id" : new_view_id})
        # logger.warning("New view id: %s"%(new_view_id))
        #
        # item = RefItem()
        # item.ref = new_view_id
        # item.db = ObjectId(imagestore.id)
        #
        # session.views.append(item)
        # session.save()

    def upload_level(self, reader, db, imageid, level=0, dry_run=False):
        """
        Uploads a given level
        expects reader, db, imageid already stored in the __self__
        """
        # Insert tiles
        reader.select_dir(level)

        logger.info("#### Uploading level %d" % (level))
        col = int(reader.width / reader.tile_width) + 1
        row = int(reader.height / reader.tile_height) + 1

        # Good old for loop
        count = 0
        for tilex in range(col):
            for tiley in range(row):
                x = tilex * reader.tile_width
                y = tiley * reader.tile_height

                if x >= reader.width or y >= reader.height:
                    continue

                # # For debug
                # fout = open(tilename, "wb")
                # fout.write(contents)
                # fout.close()
                maxlevel = get_max_depth(reader.width, reader.height, reader.tile_width)
                tilename = get_tile_name_slideatlas(tilex, tiley, maxlevel - 1)

                print count, level, tilex, tiley, tilename, dry_run

                if dry_run:
                    pass
                else:
                    tile_buffer = StringIO.StringIO()
                    reader_result = reader.dump_tile(x, y, tile_buffer)

                    if reader_result == 0:
                        continue
                    count = count + 1

                    contents = tile_buffer.getvalue()

                    imageobj = {"name": tilename, "level": level}
                    imageobj["file"] = Binary(contents)

                    del tile_buffer
                    db[str(imageid)].insert(imageobj)

        logger.warning("Uploaded %d tiles" % (count))
