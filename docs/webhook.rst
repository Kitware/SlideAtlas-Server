
Creating webhooks using celery and flask
========================================

Webhooks are http callbacks, i.e. urls that are automatically called in response to some event. Usually the purpose is to initiate some behavior.

In slide-atlas provide ability to execute certain tasks when a url is called, such as call for delivery of images.

HTTP callback must finish in reasonable time, and should not lead to timeouts due to extended
time spent in execution. And this poses challenges It simply blocks the webserver process ()

Proposed solution will define a celery task corresponding to each url endpoint.

A celery task will be submitted every time the url is called, this mechanism is to be handled by flask url endpoint.


The celery tasks should thus consider following -

- The operations should be ideally be idempotent, i.e. if the urls are called multiple times
  with the same data, the result should be same. For example, in the context of slide-atlas the "sync" operation. If the new ptif files are transferred from wsiserver3, new data is available and hence the operation will be different for the same url endpoint.

- Any intermediate data should be isolated / protected from simultaneous execution of multiple tasks 
  to avoid collisions and race conditions when two workers are simultaneously processing same tasks. This can be avoided through configuration.

A suggested procedure to create webhooks
----------------------------------------

#. First create a worker function and write tests for it
#. Write a command line wrapper to submit celery tasks
#. Write a web frontend to see tasks at hand and their progress
#. Finally create an api on web application which will submit the tasks

Command line wrapper
--------------------

.. code-block:: none

    Documentation for command line wrapper is as follows

    usage: ptif_upload.py [-h] -i INPUT -c COLLECTION -s SESSION [--bindir BINDIR]
                          [-t TILESIZE] [-m MONGO_COLLECTION] [-b] [-n] [-v]

    Utility to upload images to slide-atlas using BioFormats

    optional arguments:
      -h, --help            show this help message and exit
      -i INPUT, --input INPUT
                            Only ptif images on the file location are supporte das
                            of now
      -c COLLECTION, --collection COLLECTION
                            Collection id
      -s SESSION, --session SESSION
                            Session id
      --bindir BINDIR       Path of the image uploader binary
      -t TILESIZE, --tilesize TILESIZE
                            Tile size in pixes. (power of two recommended).
                            Defaults to tiles in input or 256
      -m MONGO_COLLECTION, --mongo-collection MONGO_COLLECTION
                            ObjectId, Destination mongodb collection name. If
                            specified collection is emptied before overwriting
      -b, --base-only       Upload only base, otherwise uploads all levels in a
                            pyramidal tiff format
      -n, --dry-run         Entirely removes the session and re-creates
      -v, --verbose         Increases verbosity for each occurence
