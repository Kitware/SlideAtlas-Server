
Interface for slide owners
==========================

If you have interesting histology / pathology slides, slide-atlas can help you share them with audience of your choice
over the web. Following tutorial enlists the steps assumes that you have already scanned the images.


Determine the login
-------------------

- Users need to register using their offical email
- TODO: Alternatively accounts for important users can be created by site administrators
- User accounts have a field for corresponding "5alphabet" code for the Philips scanner at bidmc, so your slides will be automatically
  transferred to slide-atas as they are ready.


New users / Session administrators
----------------------------------

- Normal users will see atleast one session in one database Name + Images (can we directly take the user there ?)
- Users can create a session
- Users can upload file in the attachment
- If the file has a valid extension, it will be automatically processed and can be shared

Philips scanner content providers
---------------------------------

- Will automatically see their session in philips database
- So they can refer to those images

.. note::

    If the user from above two categories graduates then site administrator will provide more access. Until then all share same database.


DB administrators
-----------------

- Have a database to manage, can create new sessions
- See only one database (or others if have access)
- Useful for keeping their images together and organized

Images coming from philips are put in single database in multiple sessions based on the id's of users
