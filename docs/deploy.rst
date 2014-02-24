

Setting up database
===================

This guide demonstrates how to install Installing multiple mongo databases on a single ubuntu server


- First install supervisord

.. code-block:: shell

    $ sudo apt-get install supervisor


Create the supervisor configuration file for new mongodb, say mongodb2.conf in /etc/supervisor/conf.d containing following example configuration

.. code-block:: guess

    [program:mongodb2]
    directory=/var/lib/mongodb2
    user=mongodb
    command=/usr/bin/mongod --dbpath /var/lib/mongodb2 --logpath
            /var/log/mongodb/mongodb2.log --logappend --port 27001 --nounixsocket

- then create the db-path and log file location for mongodb

.. code-block:: shell

    $ sudo touch /var/log/mongodb/mongodb2.log
    $ sudo chown mongodb:mongodb /var/log/mongodb/mongodb2.log
    $ sudo mkdir -p /var/lib/mongodb2
    $ sudo chown mongodb:mongodb /var/lib/mongodb2

- Restart supervisord

.. code-block:: shell

    $ sudo /etc/init.d/supervisor restart




