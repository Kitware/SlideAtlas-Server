import sys
from json import loads
sys.path.append("../..")
sys.path.append("..")
import slideatlas
import unittest

class APIv1_Tests(unittest.TestCase):
    def setUp(self):
        # Creates app and gets a client to it
        self.app1 = slideatlas.app
        self.app1.testing = True
        self.app = self.app1.test_client()

    def login_viewer(self):
        # Posts login and password for demo database access
        return self.app.post('/login.passwd', data=dict(
            username="all_demo",
            passwd=""
        ), follow_redirects=True)

    def login_admin(self):
        # Posts admin access 
        # TODO: this should use site configuration
        return self.app.post('/login.passwd', data=dict(
            username="demo_admin",
            passwd="2.0TB"
        ), follow_redirects=True)

    def logout(self):
        return self.app.get('/logout', follow_redirects=True)

    def testRestURLs(self):
        urls_to_pass = [  "/apiv1/5074589002e31023d4292d83/sessions",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/views",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/views/5074589002e31023d4292d83",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/attachments",
                                    "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/attachments/5074589002e31023d4292d83",
                                    "/apiv1/users/5074589002e31023d4292d83",
                                    "/apiv1/databases",
                                    "/apiv1/databases/507619bb0a3ee10434ae0827",
                                    "/apiv1/rules/5074589002e31023d4292d83"]

        urls_to_fail = ["/apiv1/somethingelse"]
        self.logout()

        for aurl in urls_to_pass:
            print "Testing: ",
            rv = self.app.get(aurl)
            print rv.status_code, " ", aurl
            self.failUnless(rv.status_code == 401, aurl)

        # Now test for urls that should not pass
        for aurl in urls_to_fail:
            print "Testing failure of: ", aurl
            rv = self.app.get(aurl)
            self.failUnless(rv.status_code == 404, aurl)

    def testLoginWithUser(self):
        """ Any URL should not return without logging in
        """
        user_url = "/apiv1/5074589002e31023d4292d83/sessions/5074589002e31023d4292d83/views"
        admin_url = "/apiv1/databases/5074589002e31023d4292d83"

        self.logout()

        # expact 401
        rv = self.app.get(user_url)
        print "Before login: ", rv.status_code, " ", user_url
        assert rv.status_code == 401

        rv = self.app.get(admin_url)
        print "Before login: ", rv.status_code, " ", admin_url
        assert rv.status_code == 401

        # Sign in for user access
        self.login_viewer()

        rv = self.app.get(user_url)
        print "After user login : ", rv.status_code, " ", user_url
        assert rv.status_code == 200

        rv = self.app.get(admin_url)
        print "After user login : ", rv.status_code, " ", admin_url
        assert rv.status_code == 401

        # Sign in for admin access
        self.login_admin()
        rv = self.app.get(user_url)
        print "After admin login : ", rv.status_code, " ", user_url
        assert rv.status_code == 200

        rv = self.app.get(admin_url)
        print "After admin login : ", rv.status_code, " ", admin_url
        assert rv.status_code == 204

    def testDatabaseInfo(self):
        """
        Test if the server returns database information correctly
        """
        # Sign in for admin access
        self.login_admin()
        obj = self.parseResponse("/apiv1/databases")
        self.failUnless(obj.has_key("databases"), "No database in the results")

        # Now test a particular DB
        obj = self.parseResponse("/apiv1/databases/507619bb0a3ee10434ae0827")
        self.failUnless(obj.has_key("label"), "No label in the database in the results")

        # Bound to fail 
        obj = self.parseResponse("/apiv1/databases/507619bb0a3ee10434ae0827")
        self.failUnless(obj.has_key("label"), "No label in the database in the results")


    def testDatabasePost(self):
        """
        Test if the server returns database information correctly
        """
        # Sign in for admin access
        self.login_admin()
        obj = self.parseResponse("/apiv1/databases")
        self.failUnless(obj.has_key("databases"), "No database in the results")

    def parseResponse(self, url, post=None):
        if post != None:
            #
            rv = self.app.post(url, data=post)
        else:
            #get 
            rv = self.app.get(url)
        self.failUnless(rv.status_code == 200, "Http request did not return OK (200)")

        try:
            obj = loads(rv.data)
        except:
            self.fail("Response not valid json")

        self.failIf(obj.has_key("error"), "Response contains some error")
        return obj

    def testPostToDatabase(self):
        pass

if __name__ == "__main__":
    unittest.main()
