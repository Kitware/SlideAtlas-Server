__author__ = 'dhanannjay.deo'

import unittest
import math


def get_max_depth(width, height, tilesize=256):
    extent = max(width, height)
    extent = float(extent) / tilesize
    pow = math.log(extent) / math.log(2)
    return int(math.ceil(pow) + 1)


def get_tile_index(name):
    """
    Returns the tile indexes in x, y and zoom
    """
    startx = 0
    starty = 0

    if name[0] != "t":
        raise Exception("The name must start with t")
    name = name[1:]
    level = len(name)

    while len(name) > 0:
        current = name[0]
        name = name[1:]

        startx = startx * 2
        starty = starty * 2

        if current == 't':
            pass
        elif current == 'q':
            starty = starty + 1
        elif current == 's':
            startx = startx + 1
        elif current == 'r':
            startx = startx + 1
            starty = starty + 1
        else:
            raise Exception("Invalid character in name")

    return startx, starty, level


def get_tile_name_slideatlas(x, y, z):

    tileName = "t"
    # inverse he level

    bit = 1 << z

    while bit > 1:
        tmp = 0
        bit = bit >> 1
        if x & bit:
            tmp = tmp + 1
        if y & bit:
            tmp = tmp + 2

        if tmp == 0:
            tileName += "t"
        if tmp == 1:
            tileName += "s"
        if tmp == 2:
            tileName += "q"
        if tmp == 3:
            tileName += "r"

    tileName += ".jpg"
    return tileName


class Test(unittest.TestCase):

    def testTileIndexT(self):
        self.failUnlessEqual(get_tile_index('t'), (0, 0, 0))

    def testTileIndexTT(self):
        self.failUnlessEqual(get_tile_index('tt'), (0, 0, 1))

    def testTileIndexTQ(self):
        self.failUnlessEqual(get_tile_index('tq'), (0, 1, 1))

    def testTileIndexTQR(self):
        self.failUnlessEqual(get_tile_index("tqr"), (1, 3, 2))

    def testT(self):
        self.failUnlessEqual(get_tile_name_slideatlas(0, 0, 0), "t.jpg")

    def testTT(self):
        self.failUnlessEqual(get_tile_name_slideatlas(0, 0, 1), "tt.jpg")

    def testTQR(self):
        self.failUnlessEqual(get_tile_name_slideatlas(1, 3, 2), "tqr.jpg")


    def testlong(self):
        self.failUnlessEqual(get_tile_name_slideatlas(8, 16, 5), "tqsttt.jpg")


if __name__ == "__main__":
    unittest.main()
    print get_tile_index("tqsttt")

