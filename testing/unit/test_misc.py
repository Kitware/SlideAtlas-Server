import sys
sys.path.append("../..")
sys.path.append("..")
from slideatlas.version import get_git_name
import unittest

class ImageComparisonTests(unittest.TestCase):
    def testSamelargeImage(self):
        out = get_git_name()
        # make sure it contains a .
        print "Got git describe as: ", out
        self.failUnless(out.find("-") >= 0)

if __name__ == "__main__":
    unittest.main()
