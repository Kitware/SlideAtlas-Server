import os
import sys
sys.path.append("..")
from slideatlas import create_app
import unittest
import tempfile

app = create_app()

class SlideAtlasBasicTestCase(unittest.TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def login(self):
        pass

    def test_login_logout(self):
        pass

if __name__ == '__main__':
    unittest.main()
