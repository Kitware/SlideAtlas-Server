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

Internal testing
----------------

By initializing slideatlas application within python, and visiting urls internally through pyunittest.
In future, needs to be done for each request




