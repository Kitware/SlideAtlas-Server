
Common Patterns
===============

.. todo::
   Add documentation about common module here

.. Comment
   .. Include module here
         .. automodule:: mongolistutils
         :members:

Basic list edit patterns
------------------------

The main operations which occur with the database can be generalized as list
manipulation and as a list modification, modification to the items already in
the list.

The goal of this document is to describe this generalization, and help design an
api which will make development of the site cohesive, elegant and developer
friendly.

Looking at the schema, we see that there are several kinds of list stored in
mongodb for current application. Some of the records like sessions even have
have embedded lists of views and attachments in each of the records.

Just considering the case of :ref:`admindb-label`.

- List of users
- List of registered databases
- List of rules
- List of users that obey certain rule
- List of rules for a particuar database


Compilation of the list from the persistent storage
---------------------------------------------------
 The list needs to be uniquely identified with following values

- Database
- Collection
- Query

In slide-atlas specific code, the python webserver has access to all the data in
**MongoDB** but it needs to be verified whether the user currently signed in
has access to that information. The modue which determines the access rights
also uses this code base.

Before returning the data, it needs to be verified that the caller Som -
Optionally aggregation

For example
~~~~~~~~~~~
- List of registered databases
- List of users
   - List of rules for a selected database
   - List of users affected by a particular rule

Operations on each of these lists
---------------------------------
- Remove a specified element
- Add a new element (at the end of the list)
- Change the selected element in some way
   - Change order (value) of the selected element to  (newvalue)

Python lists support all these features, but we want more functionality that is

- Upon insertion, verify that the incoming object satisfies the schema (can
  use validation from mongoengine)
- Make sure that the object manipulation is success before returning
- Support pagination in case of large number of items


Typical operation for access administration
-------------------------------------------

First use case
~~~~~~~~~~~~~~

- User logs in
- Get the user information
- Have the list of rules
- For each rule
   - Store the rule information in the session
   - Get a list of sessions that can see
   - For each session
      - Prepare for render
   - if DB admin
      - Prepare for render
- Render

Second use case
~~~~~~~~~~~~~~~

- User clicks on admin link on a session
   - Verify that user can admin that session
   - Get a list of attachments
   - Get a list of images

Third use case
~~~~~~~~~~~~~~

- User clicks on admin link on a session access
   - Verify that user can admin that session
   - Get a list of rules which contain can see
   - For each rule
      - prepare for render
   - Render

Access determination
--------------------

When user requests a particular action, whether it be displaying a certain
information or manipulating some information in the database, the previlges
of the currently logged in user must be verified each time.

This is a repeatative task. The computations are not heavy but pre-computed
information stored can be useful.


Account creation
----------------

Users select an email.

- If the email already has an account, password reset is invoked after asking user.
- Else account is created, and is marked unconfirmed.
- When user clicks the link provided in the email, is taken to password reset page.
- If the password is successfully changed, the account is ready
- If the password change fails at this point, then user must visit password reset page and continue with email confirmation






