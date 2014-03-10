from flask import Flask, render_template, session, flash
from version import get_git_name
from werkzeug.routing import BaseConverter

from flask_bootstrap import Bootstrap
import mongokit
import pymongo

import models
import sys, os

import model

# Create App
sys.path.append(os.path.dirname(__file__))
app = Flask(__name__)
#app.debug = True

# from celery import Celery
# celery = Celery(broker="mongodb://127.0.0.1/slideatlas-tasks", backend="mongodb://127.0.0.1/slideatlas-tasks")

# Configure here teh path to put downloaded folders
# (should be big and with write access to web server user)
app.config['UPLOAD_FOLDER'] = "d:/docs"
#app.config.from_object("site_slideatlas")
app.config.from_object("site_local")

# Connect if replica set
if not app.config["MONGO_IS_REPLICA_SET"]:
    slconn = mongokit.MongoClient(app.config["MONGO_URL"], tz_aware=False, auto_start_request=False)
else:
    slconn = mongokit.MongoReplicaSetClient(app.config["MONGO_URL"], tz_aware=False, auto_start_request=False, read_preference=pymongo.ReadPreference.NEAREST,
                                            replicaSet=app.config["MONGO_REPLICA_SET_NAME"])


admindb = slconn["admin"]

if app.config["LOGIN_REQUIRED"]:
    admindb.authenticate(app.config["USERNAME"], app.config["PASSWORD"])

models.registerAdminDb(app.config['MONGO_URL'], app.config['CONFIGDB'],
                           app.config['USERNAME'], app.config['PASSWORD'], 'admin')

# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

app.config['BOOTSTRAP_USE_MINIFIED'] = False

class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


app.url_map.converters['regex'] = RegexConverter

Bootstrap(app)

import security
security.registerWithApp(app)

from .views import tile
app.register_blueprint(tile.mod)
import glviewer
app.register_blueprint(glviewer.mod)

from .views import sessions
app.register_blueprint(sessions.mod)

from .views  import db_operations
app.register_blueprint(db_operations.mod)

from .views import attachments
app.register_blueprint(attachments.mod)

import jqueryupload
app.register_blueprint(jqueryupload.mod)

from .api import api
app.register_blueprint(api.mod)

from flask import send_from_directory

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.before_request
def before_request():
    pass


@app.after_request
def after_request(response):
    session.pop('openid', None)
    return response


@app.route('/about')
def about():
    return render_template('about.html', git=get_git_name(), host=app.config["MONGO_URL"])


@app.route('/')
@app.route('/home')
def home():
    """
    All routes get redirected here
    - / Says Hello <name>
    - /<name> Says Hello <name>

    """
    return render_template('home.html', git=get_git_name(), host=app.config["MONGO_URL"])
