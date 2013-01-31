import sys
sys.path.append("../..")
sys.path.append("..")
import slideatlas
import unittest

class APIv1_Tests(unittest.TestCase):
    def setUp(self):
        self.app1 = slideatlas.app
        self.app1.testing = True
        self.app = self.app1.test_client()

    def testRestURLs(self):
        urls_to_test = [  "/apiv1/5074589002e31023d4292d83/sessions",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/views",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/views/5074589002e31023d4292d83",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/attachments",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/attachments/5074589002e31023d4292d83",
                                    "/apiv1/users/5074589002e31023d4292d83",
                                    "/apiv1/databases",
                                    "/apiv1/rules/5074589002e31023d4292d83",
                                    "/apiv1/somethingelse"]

        for aurl in urls_to_test:
            print "Testing: ", aurl
            rv = self.app.get(aurl)
            assert rv.status_code != 404

if __name__ == "__main__":
    unittest.main()
