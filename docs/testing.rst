Testing SlideAtlas
==================

There should be automated tests everyday running for specific sites, and reporting to a dashboard.

External testing
----------------
Selenium web framework is used for automated testing.
In future, need to write CTest executable, by following digitalpath-testing repository.
Which invokes each of the python scripts one by one and posts the results to a CDash server.

Chrome webdriver is required as currently firefox implementation refuses to initialize WebGL.
It is not included in the source repository and needs to be included in the path.

test_on_demodb tests typical webgl image view and compares the obtained screenshot with the expected.
This test will currently  fail if the screen resolution changes from monitor to monitor. In future the test will accomodate image resize.


Internal testing
----------------

Flask provides testing context, in which it is possible to programmatically query urls and assert the expected response.
In future, needs to be done for each request

Uploading screenshots to the cdash

`Link Upload Images to Cdash <http://public.kitware.com/pipermail/cdash/2011-June/000995.html>`_




