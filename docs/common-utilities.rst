Common Utilities
----------------

.. todo::
   Add documentation about common module here 

.. Comment   
   .. Include module here 
         .. automodule:: mongolistutils
         :members:

Basic list edit patterns
------------------------

The main operations which occur with the database can be generalized as list manipulation and as a list modification, modification to the items already in the list.

The goal of this document is to describe this generalization, and help design an api which will make development of the site cohesive, elegant and developer friendly.

Looking at the schema, we see that there are several kinds of list stored in mongodb for current application. Some of the records like sessions even have have embedded lists of views and attachments in each of the records.

Just considering the case of administrative database  :ref:`admindb-label`.


Compilation of the list from the persistent storage
---------------------------------------------------
 The list needs to be uniquely identified with following values  
 
- Database
- Collection
- Query 

In slide-atlas specific code, the python webserver has access to all the data in **MongoDB ** but it needs to be verified whether the user currently signed in has access to that information.
The modue which determines the access rights also uses this code base.

Before returning the data, it needs to be verified that the caller 
Som
- Optionally aggregation 

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
   
   for example 
   








