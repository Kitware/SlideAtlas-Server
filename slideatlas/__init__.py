from flask import Flask, render_template, escape, g, request, redirect, session, url_for, flash
from celery import Celery
from version import get_git_name
from werkzeug.routing import BaseConverter

from flask_bootstrap import Bootstrap
import mongokit

import model
import sys, os

# Create App
sys.path.append(os.path.dirname(__file__))
app = Flask(__name__)
#app.debug = True

celery = Celery(broker="mongodb://127.0.0.1/slideatlas-tasks", backend="mongodb://127.0.0.1/slideatlas-tasks")

# Configure here teh path to put downloaded folders 
# (should be big and with write access to web server user)
app.config['UPLOAD_FOLDER'] = "d:/docs"
#app.config.from_object("site_slideatlas")
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

from .views import login

login.oid.init_app(app)
app.register_blueprint(login.mod)

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

    #digitalpath.init_admin_db('zomm', 'slideatlas_test')

    g.logged_in = False

    # Find out if any openid information in the sesssion
    if 'openid' in session:
        g.logged_in = True
        #g.user = session['user']
#        return
    #print "I am here .. in before request"


@app.after_request
def after_request(response):
    session.pop('openid', None)
    return response

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    """Does the login via OpenID. Has to call into `oid.try_login`
    to start the OpenID machinery.
    """
    # if we are already logged in, go back to were we came from
    g.logged_in = False
    session.clear()

    return redirect(url_for('home'))


@app.route('/')
@app.route('/home')
def home():
    """
    All routes get redirected here
    - / Says Hello <name>
    - /<name> Says Hello <name>

    """
    if 'user' in session:
        #        print session["user"]
        label = session["user"]["label"]
        email = session["user"]["email"]
    else:
        # Send the user back to login page
        # with some message
        flash("You are not logged in..", "info")
        label = None
        email = None

    return render_template('home.html', label=label, username=email, git=get_git_name(), host=app.config["MONGO_SERVER"])

