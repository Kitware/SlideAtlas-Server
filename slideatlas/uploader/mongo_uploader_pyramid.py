#vim:tabstop=2:softtabstop=2:shiftwidth=2:expandtab
"""
 Decodes the path info and fetches the corresponding tile from pymongo
 Accepts urls in the form of
      server/tile.py/database/collection/filename.jpg:
"""
import pymongo
from bson import Binary
import sys
import os
from PIL import Image
import StringIO
import re
import argparse
from . import MongoUploader

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/../..")

from slideatlas.ptiffstore import OpenslideReader

__all__ = ('MongoUploaderPyramid', )

import logging
logger = logging.getLogger("UploaderPyramid")
logger.setLevel(logging.INFO)

debug = False
tilesize = 256
force = 0
level = 0
total = 0

max_levels = 8
from multiprocessing import Process


class TileProcessor(Process):
    def __init__(self, args):
        # Iterate from here
        Process.__init__(self)

        #TODO: Remove this safegaurd
        if "max_name_length" not in args:
            args["max_name_length"] = 8

        self.max_name_length = args["max_name_length"]

        #Initial variables
        self.name = args["name"]

        #Establish connection
        self.col = args["destination"]

        self.white_tile = Image.new('RGB', (tilesize, tilesize), color=(255, 255, 255))

    def run(self):
        self.process(self.name[:-1], self.name[-1])

    def process(self, name, toadd):
        # parent = name[-1:]
        name = name + toadd

        if len(name) == self.max_name_length:
            # Query
            obj = self.col.find_one({'name': name + '.jpg'})
            if obj is None:
                return self.white_tile
            else:
                #elf.tiles[toadd] = Image.open(StringIO.StringIO(obj['file']))
                return Image.open(StringIO.StringIO(obj['file']))

        # Get parents
        q = self.process(name, 'q')
        r = self.process(name, 'r')
        s = self.process(name, 's')
        t = self.process(name, 't')

        newim = Image.new('RGB', (tilesize * 2, tilesize * 2), color=None)

        # Combine
        newim.paste(q, (0, 0))
        newim.paste(r, (tilesize, 0))
        newim.paste(s, (tilesize, tilesize))
        newim.paste(t, (0, tilesize))

        # Resize
        smallim = newim.resize((tilesize, tilesize), Image.ANTIALIAS)

        # Compress
        output = StringIO.StringIO()
        smallim.save(output, format='JPEG')
        contents = output.getvalue()
        output.close()

        # Upload
        res_obj = {
            'name':  name + '.jpg',
            'level': len(name),
            'file': Binary(contents)
            }

        # logger.info("Done with: " + name)
        self.col.insert(res_obj)
        del newim
        return smallim


def error(message):
    print '{"error" :  "' + message + '"}'
    sys.exit(1)


# def build_level(col, level, force=0, done=0, total=0, printed_percent=0):

#     #print 'Building a level: ' + str(level)

#     if debug:
#         print total

#     for arec in col.find({'level': level - 1}, {'name': 1}, timeout=False):
#         percent = int(float(done) / total * 100.0)
#         this_name = arec['name']
#         prefix = this_name[:-5]

#         # Find if already processed
#         if col.find_one({'name': prefix + '.jpg', 'level': level}) and not force:
#             if debug:
#                 print 'Already processed ..' + str(prefix)
#             # Find if the output exists and the neighbors
#             pass
#         else:
#             #Find neighbors
#             regexp = re.compile('^' + prefix)
#             if col.find({'name': regexp, 'level': level - 1}).count():
#                 # Create output image
#                 newim = Image.new('RGB', (tilesize * 2, tilesize * 2), color=None)

# #                               num_found = col.find({'name' : regexp, 'level' : level -1},timeout=False).count()
# #                               if num_found > 4:
# #                                       print 'Num found ', num_found
# #
#                 # Paste all the ancestors
#                 for brec in col.find({'name': regexp, 'level': level - 1}, timeout=False):
#                     chunk_name = brec['name']

#                     if chunk_name[-5] == 'q':
#                         box = (0, 0)
#                         pass
#                     elif chunk_name[-5] == 'r':
#                         box = (tilesize, 0)
#                         pass
#                     elif chunk_name[-5] == 's':
#                         box = (tilesize, tilesize)
#                         pass
#                     elif chunk_name[-5] == 't':
#                         box = (0, tilesize)

#                     # Load the chunk
#                     im = Image.open(StringIO.StringIO(brec['file']))
#                     if im.size[0] != tilesize or im.size[1] != tilesize:
#                         print '#####'
#                         print im.size
#                         print '#####'
#                     newim.paste(im, box)
#                 # Done all the ancestors

#                 # Resize it
#                 smallim = newim.resize((tilesize, tilesize), Image.ANTIALIAS)
#                 if debug:
#                     print smallim.size
#                     smallim.save(prefix + '.jpg')

#                 # Compress it in memory
#                 output = StringIO.StringIO()
#                 smallim.save(output, format='JPEG')
#                 contents = output.getvalue()
#                 output.close()

#                 # Insert it back
#                 try:
#                     # Now we know we have some result
#                     # Try to store result in database
#                     res_obj = {
#                             'name': prefix + '.jpg',
#                             'level': level,
#                             'file': Binary(contents)
#                             }
#                     coll.insert(res_obj)
#                 except:
#                     error('Could not insert')

#             # Done processing for neighbors found

#         # Done an unprocessed ancestor
#         if not printed_percent == percent:
#             print '{"progress_percent" :  "%2.0f' % (percent) + '"}'
#             printed_percent = percent

#         done = done + 1

#     # Done processing all records in the previous level
#     col.ensure_index('name', unique=True)
#     #print '\nDone Level !'
#     return [done, printed_percent]


# def construct_pyramid(col, level):
#     # Determine the highest level
#     item = col.find_one({'level': 0}, {'name': 1, '_id': 0})
#     highest_level = len(item['name']) - 4
#     #print 'Highest Level: ' + str(highest_level)
#     total = col.find({'level': level}).count() * (1.4)
#     done = 0
#     printed_percent = 0
#     for i in range(level + 1, highest_level):
#         [done, printed_percent] = build_level(col, i, total=total, done=done, printed_percent=printed_percent)
#     # Assume a square shape with given level

# # Parse the command line
# if __name__ == '__main__':


#     sys.exit(0)

#     parser = argparse.ArgumentParser(description='Utility to synchronize sessions on two servers')

#     parser.add_argument('server', help='MongoDB Server', default="127.0.0.1")
#     parser.add_argument('db', help='Database instance', default="mydb")
#     parser.add_argument('image', help='Image collection name (ObjectId string)')
#     parser.add_argument('-f', '--force', help='Entirely removes the session and re-creates', action='store_true')

#     parser.set_defaults(server="127.0.0.1", db="mydb")

#     args = parser.parse_args()

#     # Try opening the database
#     #try:
#     conn = pymongo.Connection(args.server)
#     db = conn[args.db]
#     coll = db[args.image]
#     #except:
#     #     error("Error while opening image")

#     try:
#         coll.ensure_index('name', unique=True)
#         if args.force:
#             #print 'Removing ..', coll.find({'level':{'$gt':0}}).count()
#             coll.remove({'level': {'$gt': 0}})
#     except:
#         error("Pre-processing failed")

#     construct_pyramid(coll, level)

#     try:
#         pass
#     except:
#         error("Pyramid not built")
#     sys.exit(0)


class MongoUploaderPyramid(MongoUploader):
    """
    Uploader class to create image pyramid using python multi-threads
    """
    def __init__(self, args):
        super(MongoUploaderPyramid, self).__init__(args)

    def make_reader(self):
        #todo: choose the reader here
        reader = OpenslideReader()
        reader.set_input_params({'fname': self.args.input})
        return reader

    def upload_base(self):
        import time
        start = time.clock()

        # Start 4 threads
        tq = TileProcessor({"name": 'tq', "destination": self.destination})
        tq.start()

        tr = TileProcessor({"name": 'tr', "destination": self.destination})
        tr.start()

        ts = TileProcessor({"name": 'ts', "destination": self.destination})
        ts.start()

        tt = TileProcessor({"name": 'tt', "destination": self.destination})
        tt.start()

        tq.join()
        tr.join()
        ts.join()
        tt.join()


        t = TileProcessor({"name": 't', "destination": self.destination})
        t.start()
        t.join()

        print 'Time: ',  time.clock() - start
        print 'Done'

