from comparetools import sameimage, samefile

import unittest, time, re

class ImageComparisonTests(unittest.TestCase):
    def testSamelargeImage(self):
        self.failUnless(sameimage("imgs/glview.png", "imgs/glview.png"))

    def testSameFiles(self):
        self.failUnless(samefile("imgs/glview.png", "imgs/glview.png"))

    def testSameFiles(self):
        self.failIf(samefile("imgs/glview.png", "imgs/demo_glview.png"))


if __name__ == "__main__":
    unittest.main()
