#!/usr/bin/env python

from flask import Flask
import gevent.wsgi
import gevent.monkey
import werkzeug.serving

gevent.monkey.patch_all()
app = Flask(__name__)
app.debug = True


@app.route("/")
def hello():
    return "Hello World!"


@werkzeug.serving.run_with_reloader
def run_server():
    ws = gevent.wsgi.WSGIServer(listener=('0.0.0.0', 5000),
                                application=app)
    ws.serve_forever()

if __name__ == "__main__":
    run_server()