import sys, os


parentdir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,parentdir) from slideatlas.version import get_git_name
import unittest

class MiscTests(unittest.TestCase):
    def testSamelargeImage(self):
        out = get_git_name()
        # make sure it contains a .
        print "Got git describe as: ", out
        self.failUnless(out.find("-") >= 0)

if __name__ == "__main__":
    unittest.main()
