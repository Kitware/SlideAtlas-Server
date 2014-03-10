__author__ = 'dhanannjay.deo'

__author__ = 'dhan'
import sys
import os
sys.path.append(os.path.abspath(".."))
import unittest
from extract_tile import TileReader

class testTileReader(unittest.TestCase):
    def setUp(self):
        # Creates app and gets a client to it
        self.reader = TileReader()
        self.reader.SetInputParams({"fname" : "c:\\Users\\dhanannjay.deo\\Downloads\\example.tif"})

    def test_dump_tile(self):
        pass



if __name__ == "__main__":
    unittest.main()
