#!/usr/bin/env python

from flask import Flask
from flask_sockets import Sockets
import os
import msgpack
from gevent import monkey, wsgi
monkey.patch_all()
from bson import BSON
from bson.binary import Binary

import werkzeug.serving
from slideatlas import app

sockets = Sockets(app)

@sockets.route('/ws') 
def echo_socket(ws): 
    while True: 
        message = ws.receive()
        req = BSON(message).decode()
        print req 
        fin = open(os.path.dirname(os.path.abspath(__file__)) + "/data/tiger.jpg")
        # resp = msgpack.packb({"image" : fin.read()}, use_bin_type=1, encoding="raw")
         
        resp = BSON.encode({"request" : req, "image" : Binary(fin.read())})

        # print len(resp)
        # print BSON.decode(resp)

        # print resp
        ws.send(resp, True)


def run_server():
    ws = gevent.wsgi.WSGIServer(listener=('0.0.0.0', 8080),
                                application=app)
    ws.serve_forever()

if __name__ == "__main__":
    run_server()
