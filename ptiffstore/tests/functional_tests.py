import os
from ..tiff_reader import TileReader
import svgwrite
import base64
import logging


""" TODO: These tests require
    use nosetests to run them from top directory
    Not all functions here

"""


def test_write_svg(scale=100.0, toextract=False, fname="c:\\Users\\dhanannjay.deo\\Downloads\\example.tif"):
    tile = TileReader()
    tile.set_input_params({"fname" : fname})

    #for dir in [0,1,2,3,4]:
    #for dir in tile.levels.keys():
    for dir in [1,2,3,4,5,6]:
        tile.select_dir(dir)
        print "Reading level: ", dir

        image_length = tile.height
        image_width = tile.width
        tile_length = tile.tile_height
        tile_width = tile.tile_width

        dwg = svgwrite.Drawing(filename="test_%d.svg"%(dir), size=(image_width / scale,image_length/scale), debug=True)

        print "Selected Dir: ", dir, "Actual: ", tile.dir
        print "Image: ", image_width, image_length
        print "isBigTIFF: ", tile.isBigTIFF

        count = 0
        done = 0
        y = 5
        yc = 0
        while y < image_length:
            x = 5
            xc = 0
            while x < image_width:
                #print "Tile number for (%d,%d): "%(x,y), tile_no
                fp = StringIO.StringIO()
                r = tile.dump_tile(x,y,fp)
                count = count + 1
                if r > 0:
                    if(toextract):
                        outputpath = os.path.abspath(os.path.join(os.path.dirname(__file__),"output"))
                        fname = os.path.join(outputpath, str(dir),"%d_%d.jpg"%(xc,yc) )
                        logging.log(logging.ERROR, fname)
                        fp2 = open(fname, "wb")
                        fp2.write(fp.getvalue())
                        fp2.close()
                    done = done + 1
                    #print count, done, r
                    color = "purple"
                    dwg.add(dwg.rect(insert=(x/scale*px, y/scale*px), size=(512.0/scale*px, 512.0/scale*px),
                        fill="purple", opacity="0.5", stroke='red', stroke_width=1*px))
                    #dwg.add(dwg.circle(center=(x/scale*px, y/scale*px), r=(2*px), stroke='red', stroke_width=2*px))
                else:
                    pass
                fp.close()
                #dwg.add(dwg.rect(insert=(x/10.0*px, y/10.*px), size=(512./10*px, 512.0/10*px),
                #    fill="purple", opacity="0.5", stroke='red', stroke_width=1*px))
                xc = xc + 1
                x += tile_width

            y += tile_length
            yc = yc + 1
        dwg.save()
        print "Done ..", done, " out of: ", tile.num_tiles


def list_tiles(dir, fname="d:\\data\\phillips\\20140313T130524-183511.ptif"):
    tile = TileReader()
    tile.set_input_params({"fname" : fname})
    tile.select_dir(dir)

    image_length = tile.height
    image_width = tile.width
    tile_length = tile.tile_height
    tile_width = tile.tile_width

    print "Selected Dir: ", dir, "Actual: ", tile.dir
    print "Image: ", image_width, image_length
    print "Width+Height :", tile_width, tile_length
    print "NoTiles: ", tile.num_tiles
    print "isBigTIFF: ", tile.isBigTIFF
    print "Levels: ", len(tile.levels.keys())

def test_embedded_images():
    tile = TileReader()
    input_params = {"fname" : "/home/dhan/data/phillips/20140313T180859-805105.ptif"}
    tile.set_input_params(input_params)

    for imagetype in ["label", "macro"]:
        fout = open(input_params["fname"] + "_" + imagetype + ".jpg", "wb")
        fout.write(base64.b64decode(tile.get_embedded_image(imagetype)))
        fout.close()

def extract_tile():
    tile = TileReader()
    tile.set_input_params({"fname" : "/home/dhan/data/phillips/20140313T180859-805105.ptif"})
    of = open("test.jpg","wb")
    tile.get_tile_from_number(27372, of)
    of.close()

def test_barcode():
    tile = TileReader()
    tile.set_input_params({"fname" : "/home/dhan/data/phillips/20140313T180859-805105.ptif"})

