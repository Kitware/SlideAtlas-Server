#!/usr/bin/env python

from flask import Flask
from flask_sockets import Sockets
import os

from gevent import monkey, wsgi
monkey.patch_all()

import werkzeug.serving
from slideatlas import app

sockets = Sockets(app)

@sockets.route('/ws') 
def echo_socket(ws): 
    while True: 
        message = ws.receive() 
        fin = open(os.path.dirname(os.path.abspath(__file__)) + "/data/tiger.jpg")
        #fin = open("/home/dhan/projects/flask-slideatlas/data/tiger.jpg")
        ws.send(fin.read(), True)


def run_server():
    ws = gevent.wsgi.WSGIServer(listener=('0.0.0.0', 8080),
                                application=app)
    ws.serve_forever()

if __name__ == "__main__":
    run_server()
