

Execution of periodic tasks
===========================

.. warning::

     If multiple celery workers are launched using same brocker (in our case mongodb database) they might steal each others jobs. Please consider this before starting mongodb locally.

The command to run worker (consumer) for all tasks defined in autosync.py is as follows. The workers must be running or otherwise the jobs submitted will not execute.

.. code-block:: shell-session

     $ celery worker -A slideatlas.tasks.autosync -c 1 --loglevel=INFO

-c 1 defines concurrency = 1 i.e. a single worker process will be running at a time. This may be increased for production.


Periodic processing
-------------------

Celery beat is used to trigger imagestore sync job every 5 minutes. It can be manually tested using command

.. code-block:: shell-session

     $ celery beat -A slideatlas.tasks

Both producer and consumer are run using supervisor for which configuration is supplied in the config repository.


Uploads and Tasks
=================

User can use web interface to upload their supported image files.
Images are always uploaded to a session.

The progress can be monitored from the sessions in which the images

Uploading the files
-------------------

Files are uploaded to gridfs
Chunksize of the gridfs and chunksize in the javascript dicing are made same thus making it easy to append the gridfs objects manually.

The first chunk creates the gridfile instance and the reference has to be shared perhaps through session

The requests must post a request to upload new file, and the server returns a unique fileid, which is the destination of the post requests.
The client can then send this _id back as formdata. Any further request from client without any unique valid is considered error.


When any put request is received, the the request is first received (i.e. content-range starts with zero), The unique file ID is created, and is sent back as in return json.
Client side keeps this information and sends it back with each following request. Similarly updated md5 can also be sent which is finally updated in gridfs when the entire file is inserted.

The gridfs should contain some information to indicate that the file is not complete to avoid partial file handling.

Dicing the uploaded files
-------------------------

A celery task is created with the

- Database id
- File identifier in the gridfs

A celery process, when free will  fetch the file and perform dicing
Creates a new imageid in the process of uploading image in the conventional sense
Either triggers pyramid building task, or that task gets chained

Building pyramids after the base is ready
-----------------------------------------

Knows the image id

Finishing (i.e. fixing thumbnails etc)
--------------------------------------
