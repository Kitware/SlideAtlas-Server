from flask import Flask, render_template, escape, g, request, redirect, session, url_for, flash

from flask_bootstrap import Bootstrap

import model

import digitalpath

app = Flask(__name__)
Bootstrap(app)


app.config['BOOTSTRAP_USE_MINIFIED'] = False
# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

from .views import login
from .views.login import oid

login.oid.init_app(app)
app.register_blueprint(login.mod)

from .views import tile
app.register_blueprint(tile.mod)

from .views import webgl_viewer
app.register_blueprint(webgl_viewer.mod)

from .views import sessions
app.register_blueprint(sessions.mod)

@app.before_request
def before_request():

    digitalpath.init_admin_db('zomm', 'slideatlas_test')

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
        name = session["user"]["label"]
    else:
        # Send the user back to login page
        # with some message
        flash("You are not logged in..", "info")
        name = 'World'

    
    return render_template('hello.html', name=name)


