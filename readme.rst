To install dependencies
-----------------------

Requires python 2.7x, and pip.

Click here to install `python <http://www.python.org/download/>`_ and `pip <http://stackoverflow.com/questions/4750806/how-to-install-pip-on-windows>`_ on windows
Also please make sure that the python and scritps ("c:/python27/Scripts") are in PATH environment variable.

To install dependencies mentioned in **requirements.txt**

.. code-block:: none

   $ pip install -r requirements.txt --upgrade
   

To build documentation
----------------------
Detailed documentation can be built using sphinx

.. code-block:: none

   $ cd docs
   $ make html 

To test
-------

CMake is required for testing.

.. code-block:: none

   $ cd testing
   $ ctest -S ctest_driver.cmake


To run
------

.. code-block:: none

   $ python run.py

This will start a webserver if the mongo database server is correctly configured in some configuration file similar to **site_local.py**.





