

Setting up database
===================

This guide demonstrates how to install Installing multiple mongo databases on a single Ubuntu server


- First install supervisord

.. code-block:: shell-session

    $ sudo apt-get install supervisor


Create the supervisor configuration file for new mongodb, say mongodb2.conf in /etc/supervisor/conf.d containing following example configuration

.. code-block:: guess

    [program:mongodb2]
    directory=/var/lib/mongodb2
    user=mongodb
    command=/usr/bin/mongod --dbpath /var/lib/mongodb2 --logpath
            /var/log/mongodb/mongodb2.log --logappend --port 27001 --nounixsocket

- then create the db-path and log file location for mongodb

.. code-block:: shell-session

    $ sudo touch /var/log/mongodb/mongodb2.log
    $ sudo chown mongodb:mongodb /var/log/mongodb/mongodb2.log
    $ sudo mkdir -p /var/lib/mongodb2
    $ sudo chown mongodb:mongodb /var/lib/mongodb2

- Restart supervisord

.. code-block:: shell-session

    $ sudo /etc/init.d/supervisor restart

Websockets
==========

Ptif tiles are served from a separate process, which interacts with websockets endpoint over zeromq sockets.

Websocket service upon handshake will connect with a known endpoint.

For rest of the websocket connection life, all messages from the browser will be relayed to the worker, and all responses from the worker will be relayed to the browser in non-blocking infinite loop.

Even though multiple indentical worker threads / processes can be spawned, a single end point is specified which performs load balancing.



Worker process 
--------------

- Registers with the router
- Maintains a cache of readers open files
- One or more workers can be spawned to utilize multiple cores

Reader cache
------------

- Per process
- Operation to open file or change directory is expensive, so keep the reader states in memory and return utilize 

The router 
----------

- No process should remain idle 
- Since the websockets are stateful i.e. when user is browsing a particular view, the files and directories within the file that will be needed are fixed, and this information should be used while routing the requests
- Remebers the items in the workers cache, and will route the requests accordingly
- Should be least expensive   


