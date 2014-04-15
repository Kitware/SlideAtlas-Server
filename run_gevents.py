#!/usr/bin/env python

from flask import Flask
import gevent.wsgi
import gevent.monkey
gevent.monkey.patch_all()

import werkzeug.serving
from slideatlas import app

def run_server():
    ws = gevent.wsgi.WSGIServer(listener=('0.0.0.0', 8080),
                                application=app)
    ws.serve_forever()

if __name__ == "__main__":
    run_server()
