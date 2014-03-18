__author__ = 'dhanannjay.deo'

def get_tile_name_slideatlas(x,y, z):

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
            tileName += "q"
        if tmp == 1:
            tileName += "r"
        if tmp == 2:
            tileName += "t"
        if tmp == 3:
            tileName += "s"

    tileName += ".jpg";
    return tileName
import unittest

class Test(unittest.TestCase):
    def testT(self):
        #
        # ['t', 0, 0]
        # ['tt', 0, 1]
        # ['tq', 0, 0]
        # ['tr', 1, 0]
        # ['ts', 1, 1]
        # ['ttt', 0, 3]
        # ['ttq', 0, 2]
        # ['ttr', 1, 2]
        # ['tts', 1, 3]
        #
        # ['tqt', 0, 1]
        # ['tqq', 0, 0]
        # ['tqr', 1, 0]
        # ['tqs', 1, 1]
        # ['trt', 2, 1]
        # ['trq', 2, 0]
        # ['trr', 3, 0]
        # ['trs', 3, 1]
        # ['tst', 2, 3]
        # ['tsq', 2, 2]
        # ['tsr', 3, 2]
        # ['tss', 3, 3]
        # ['ttt', 0, 3]
        # ['trt', 2, 1]
        # ['tqs', 1, 1]
        # ['tqsttt', 8, 15]
        # ['tqst', 2, 3]
        # ['tqstt', 4, 7]
        self.failUnlessEqual(get_tile_name_slideatlas(0,0,0), "t.jpg")

    def testTT(self):
        self.failUnlessEqual(get_tile_name_slideatlas(0,0,1), "tq.jpg")

    def testlong(self):
        self.failUnlessEqual(get_tile_name_slideatlas(8,15,5), "tqsttt.jpg")# ['tqsttt', 8, 15]


if __name__ == "__main__":
    unittest.main()

