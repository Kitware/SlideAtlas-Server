from flask import Flask, render_template, escape, g, request, redirect, session, url_for, flash, send_from_directory
from slideatlas.version import get_git_name
from werkzeug.routing import BaseConverter
import glviewer
from flask_bootstrap import Bootstrap
import mongokit

import sys, os

# Create App
sys.path.append(os.path.dirname(__file__))
app = Flask(__name__)
#app.debug = True

app.config.from_object("site_local")

# Connection settings for local demo database for testing (VM)
slconn = mongokit.Connection(app.config["MONGO_SERVER"], tz_aware=False, auto_start_request=False)
admindb = slconn["admin"]

if  app.config["LOGIN_REQUIRED"]:
    admindb.authenticate(app.config["USERNAME"], app.config["PASSWORD"])

# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

app.config['BOOTSTRAP_USE_MINIFIED'] = False

class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


app.url_map.converters['regex'] = RegexConverter

Bootstrap(app)

import glviewer
app.register_blueprint(glviewer.mod)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/')
@app.route('/home')
def home():
    """
    All routes get redirected here
    - / Says Hello <name>
    - /<name> Says Hello <name>

    """
    return render_template('home.html', git=get_git_name(), host=app.config["MONGO_SERVER"])

