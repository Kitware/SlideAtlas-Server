#!/usr/bin/env python
"""
LICENCE
-------
Copyright 2013 by Kitware, Inc. All Rights Reserved. Please refer to
KITWARE_LICENSE.TXT for licensing information, or contact General Counsel,
Kitware, Inc., 28 Corporate Drive, Clifton Park, NY 12065.

"""

import gevent.monkey
gevent.monkey.patch_all()

import gevent.wsgi

# from flask import Flask
# import werkzeug.serving
from app import app

import sys
from flask_sockets import Sockets


sockets = Sockets(app)

@sockets.route('/ws')
def echo_socket(ws):
    while True:
        message = ws.receive()
        ws.send(message)


def run_server():
    ws = gevent.wsgi.WSGIServer(listener=('0.0.0.0', 5003),
                                application=app)
    ws.serve_forever()

if __name__ == "__main__":
    print "Gevents server is not ready yet"
    sys.exit(1)
    # run_server()
