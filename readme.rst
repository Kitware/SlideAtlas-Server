To install dependencies
-----------------------

Requires python 2.7x, pip is useful for instlling all dependencies at once.

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





