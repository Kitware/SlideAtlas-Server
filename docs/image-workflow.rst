
Image upload workflow
=====================

- User uploads the iamge
- A function scans the file extension and determines the queue type
- if yes submits the job, the task id obtained is stored in users object as the
- The ongoing task is stored in the attachments entry, and also in another tasks collection
- Following tasks are executed in sequence
    - Copy file from gridfs
    - Dicing
    - Pyramid building
    - Creating thumbnail
    - Marking the image as ready
    - Remove the record from tasks collection
    - Bookkeeping tasks collection based on date

User notification
=================

- Sees ongoing task progress that are started in the admin access of site / databases / sessions in the same hierarchy
- When the task is complete, see the session with available images

Other concerns
==============

- What happens to the workers working on a job when the client which started the job is restarted

