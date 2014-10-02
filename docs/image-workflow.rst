
Image upload workflow
=====================

- User uploads the image using web interface
- The upload progress is shown on the client side as the chunks of the image are uploaded into gridfs
- After the last chunk is processed

    - A celery task is submitted to deal with newly uploaded imagefile
    - Update the "status" in the metadata of the imagefile in gridfs to "pending"

- When celery worker picks up this task, following sub-tasks are executed in sequence

    - Copy file from gridfs into a temporary location
    - Update the "status" in the metadata of the imagefile in gridfs to "processing"
    - Choose the uploader based on file extention
    - Update the image metadata in imagestore
    - Dice the image to a multiresolution pyramid
    - Create a view in corresponding session
    - Update the "status" in the metadata of the imagefile in gridfs to "ready"
    - Cleanup the temporary download location

- If something goes wrong, the status of imagefile is updated to "failed" with some reason.

- Now when the user sees imagefile item, the user sees either "finish", or "retry" buttons. At this time a view is also visible in the session.

- Finish button will hide the imagefile entry (or delete ?). The imagefile will now be only accessible through imagestore interface (Not ready)
