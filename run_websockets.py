#!/usr/bin/env python

from gevent import monkey
monkey.patch_all()

from gevent import wsgi
from geventwebsocket.handler import WebSocketHandler

from flask import Flask
from flask_sockets import Sockets
import os

from bson import BSON
from bson.binary import Binary
import pymongo
import werkzeug.serving
from slideatlas import create_app
from slideatlas import models

app = create_app()
sockets = Sockets(app)

@sockets.route('/ws')
def tile_socket(ws):
    tilestore = None
    while True:
        message = ws.receive()
        # Wraps entire websocket response, any errors will be reported back
        try:
            req = BSON(message).decode()
            if "init" in req:
                """
                Initialization request
                """
                tilestore = models.Database.objects.get(id=req["init"]["db"])
                if tilestore == None:
                    raise Exception("Tile Store %s not found"%(req["init"]["db"]))
                resp = BSON.encode({"request" : req, "success" : True})

            elif "tile" in req:
                """
                Regular request
                """
                if tilestore == None:
                    raise Exception("Tile Store not initialized")

                imgdata = tilestore.get_tile(req["tile"]["image"], req["tile"]["name"])
                resp = BSON.encode({"request" : req, "image" : Binary(imgdata), "success" : True})
            else:
                raise Exception("Unknown request")
            ws.send(resp, True)

        except Exception as e:
            resp = BSON.encode({"request" : req, "error" : e.message})
            ws.send(resp, True)


def run_server():
    ws = wsgi.WSGIServer(listener=('0.0.0.0', 8080),
                                application=app, handler_class=WebSocketHandler)
    ws.serve_forever()

if __name__ == "__main__":
    run_server()
