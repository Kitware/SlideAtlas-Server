from flask import Flask, render_template, escape, g, request, redirect, session, url_for

from flask.ext.bootstrap import Bootstrap
from flaskext.openid import OpenID

app = Flask(__name__)
Bootstrap(app)
oid = OpenID(app)


app.config['BOOTSTRAP_USE_MINIFIED'] = False
# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'


@app.before_request
def before_request():
    g.logged_in = False

    # Find out if any openid information in the sesssion 
    if 'openid' in session:
        g.logged_in = True
        #g.user = session['user']
#        return
    print "I am here .. in before request"


@app.after_request
def after_request(response):
    session.pop('openid', None)
    return response


@app.route('/sessions')
def sessions(name=None):
    """
    - /sessions  With no argument displays list of sessions accessible to current user
    - /sessions?sess=10239094124  searches for the session id 
    """
    if 'user' in session:
        name = session["user"]["name"]
        email = session["user"]["email"]
    else:
        # Send the user back to login page
        # with some message
        return redirect(url_for('login'))

    # See if the user is requesting any session id
    sessid = request.args.get('sess', None)
    if sessid:
        # Find and return a single session
        asession = {}
        return render_template('session.html', session=asession, name=name)

    else:
        # Find and return a list of session names / ids
        sessionlist = []
        # Array of dictionaries

        return render_template('sessionlist.html', sessions=sessionlist, name=name)

@app.route("/")
@app.route('/home/<name>')
def home(name=None):
    """
    All routes get redirected here 
    - / Says Hello <name>
    - /<name> Says Hello <name>
    """
    if 'user' in session:
        name = session["user"]["name"]
        email = session["user"]["email"]
        return render_template('hello.html', name=name, email=email)
#        return render_template('hello.html')
    else:
        return render_template('hello.html', name=name)



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

@app.route('/login', methods=['GET', 'POST'])
@oid.loginhandler
def login():
    """Does the login via OpenID. Has to call into `oid.try_login`
    to start the OpenID machinery.
    """
    # if we are already logged in, go back to were we came from
    if g.logged_in == True:
        app.logger.info('logged-in: ' + oid.get_next_url())
        return redirect(oid.get_next_url())
    if request.method == 'POST' or request.method == 'GET':
        openid = request.form.get('openid_identifier')
        if openid:
            app.logger.info(request.form)
            app.logger.info('logging-in: ' + oid.get_next_url())
            return oid.try_login(openid, ask_for=['email', 'fullname',
                                                  'nickname'])
    app.logger.info('not-logged-in: ' + oid.get_next_url())
    return render_template('login.html', next=oid.get_next_url(),
                           error=oid.fetch_error())


@oid.after_login
def create_or_login(resp):
    """This is called when login with OpenID succeeded and it's not
    necessary to figure out if this is the users's first login or not.
    This function has to redirect otherwise the user will be presented
    with a terrible URL which we certainly don't want.
    """
    session['openid'] = resp.identity_url
    name = resp.fullname or resp.nickname

    session['user'] = {'url': resp.identity_url,
                         'name': name,
                         'email': resp.email}

    return redirect(url_for('home'))



