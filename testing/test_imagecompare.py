from imagecompare import imagecompare

import unittest, time, re

class ImageComparisonTests(unittest.TestCase):
    def testSamelarImageas(self):
        self.failUnlessEqual(imagecompare("imgs/glview.png", "imgs/glview.png"), 0.0)

if __name__ == "__main__":
    unittest.main()
