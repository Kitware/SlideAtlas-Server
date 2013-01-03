from flask import Flask, render_template, escape, g, request, redirect, session, url_for, flash

from flask_bootstrap import Bootstrap
import mongokit


import model

import sys, os

# Create App
sys.path.append(os.path.dirname(__file__))
app = Flask(__name__)

# Configure here teh path to put downloaded folders 
# (should be big and with write access to web server user)
app.config['UPLOAD_FOLDER'] = "d:/docs"

# Connection settings for local demo database for testing (VM) 
slconn = mongokit.Connection("127.0.0.1:27018", tz_aware=False, auto_start_request=False)
admindb = slconn["admin"]

## Connection settings for live slide atlas  
#slconn = mongokit.Connection("slide-atlas.org:27017", tz_aware=False, auto_start_request=False)
#admindb = slconn["admin"]
#.authenticate("slideatlasweb", "2%PwRaam4Kw")

# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

app.config['BOOTSTRAP_USE_MINIFIED'] = False
Bootstrap(app)

from .views import login
from .views.login import oid

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
    session.pop('user', None)
    session.pop('openid', None)
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
        label = 'World'
        email = None

    return render_template('hello.html', name=label, email=email)


