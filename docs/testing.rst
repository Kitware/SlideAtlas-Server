Testing SlideAtlas
==================

To invoke tests

.. code-block:: none

   $ cd testing
   $ ctest -S ctest_driver.cmake

Test results are submitted to - `dashboard <http://my.cdash.org/index.php?project=DigitalPath>`_ in slideatlas subproject.

The testing code is based on CTest, python, selenium and unittest module (which is included in standard python libraries.
Selenium webdriver executable must be installed at correct path (to be specified in some config file.

To add a new test:
  Add a new Python function, with a name starting with "test", to 'database_tests.py',

The name of the file should start with "test". E.g. testAttachmentUpload.py so that it will be discovered by
the CTest and will be executed and results will be uploaded.

.. code-block:: python

   import unittest

   class SlideAtlasBasicTestCase(unittest.TestCase):
       def setUp(self):
           pass

       def tearDown(self):
           pass

       def testAlwaysPasses(self):
           self.assertTrue(True)

      def testAlwaysFails(self):
           self.assertTrue(False)

   if __name__ == '__main__':
       unittest.main()


To change the dashboard submission location:
  Replace 'CTestConfig.cmake' with the new dashboard information.

Automated testing should be setup to for specific sites, and reporting to a dashboard.


Regression testing
------------------

Regression testing or behavior testing or functional testing uses Selenium web framework is
used for browser automation to play back pre-recorded user behavior and compare the
functioning of site by comparing the expected output from the server.
.
Chrome webdriver is required as currently firefox implementation refuses to initialize WebGL.
It is not included in the source repository and needs to be included in the path.

And example test -  test_on_demodb tests typical webgl image view and compares the obtained screenshot with the expected.
This test will currently  fail if the screen resolution changes from monitor to monitor. In future the test will accommodate image resize.

Internal testing
----------------

Flask provides testing context, in which it is possible to programmatically query urls and assert the expected response.
In future, needs to be done for each request

Uploading screenshots to the cdash

`Link Upload Images to Cdash <http://public.kitware.com/pipermail/cdash/2011-June/000995.html>`_


Smoke testing
=============

Smoke testing uses selenium browser automation to perform some basic navigation, and expect some dom in the returned elements. We are also comparing the end view with a screenshot captured during test setup.

Chrome webdriver should be installed from `here <http://chromedriver.storage.googleapis.com/index.html>`_ 

And should be in the binaries path before tests are invoked.



Basic glviewer on demo database 
-------------------------------

.. code-block :: shell-session




- Chrome browser is started with given size (important for screenshot comparison later)
- Browser is pointed to new.slide-atlas.org
- Any existing user is logged out
- password login is attempted using "all_demo" username and no password
- First image is clicked from "Skin" session
- The test passes if the resulting screenshot of glviewer matches with the one taken while creating the test 









