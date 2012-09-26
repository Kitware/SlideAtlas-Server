from flask import Flask, render_template, escape, g, request, redirect, session
from flask.ext.bootstrap import Bootstrap
from flaskext.openid import OpenID

app = Flask(__name__)
Bootstrap(app)
oid = OpenID(app)


app.config['BOOTSTRAP_USE_MINIFIED'] = False

# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'


@app.route("/")
@app.route('/<name>')
def hello(name=None):
    """
    All routes get redirected here 
    - / Says Hello <name>
    - /<name> Says Hello <name>
    """
    return render_template('hello.html', name=name)

@app.before_request
def before_request():
    g.user = None
    if 'openid' in session:
        g.user = session['name']


@app.after_request
def after_request(response):
#    session.remove()
    return response



@app.route('/login', methods=['GET', 'POST'])
@oid.loginhandler
def login():
    """Does the login via OpenID. Has to call into `oid.try_login`
    to start the OpenID machinery.
    """
    # if we are already logged in, go back to were we came from
    if g.user is not None:
        app.logger.info('logged-in: ' + oid.get_next_url())
        return redirect(oid.get_next_url())
    if request.method == 'POST' or request.method == 'GET':
        openid = request.form.get('openid_identifier')
        if openid:
            app.logger.info(request.form)
            app.logger.info('logging-in: ' + oid.get_next_url())
            return oid.try_login(openid, ask_for=['email', 'fullname',
                                                  'nickname'])
    print "I am here "
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
    email = resp.email
    return render_template('hello.html', name=name, email=email)



