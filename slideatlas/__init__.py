from flask import Flask, render_template, escape, g, request, redirect, session, url_for

from flask.ext.bootstrap import Bootstrap


import digitalpath

app = Flask(__name__)
Bootstrap(app)


app.config['BOOTSTRAP_USE_MINIFIED'] = False
# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

from .views import login
login.oid.init_app(app)
app.register_blueprint(login.mod)


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
    sessid = request.args.get('sessid', None)
    if sessid:
        # Find and return a single session
        asession = {   'sessid' : 1234,
                                 'label' : 'Sessions1 label',
                                             }

        return render_template('session.html', session=asession, name=name)

    else:
        # Find and return a list of session names / ids
        sessionlist = []

        sessionlist.append({'rule':'Rule1 label',
            'sessions' :[
                                { 'sessid' : 1234,
                                  'label' : 'Sessions1 label',
                                  'images' : False },

                                { 'sessid' : 1234,
                                  'label' : 'Sessions2 label',
                                  'canadmin' : True},
                                  ]
            })
        # Array of dictionaries

        sessionlist.append({'rule':'Rule2 label',
            'sessions' :[
                                { 'sessid' : 1234,
                                  'label' : 'Rule2 Sessions1 label',
                                  'images' : True },

                                { 'sessid' : 1234,
                                  'label' : 'Rule 2 Sessions2 label',
                                  'canadmin' : False},
                                  ]
            })

        return render_template('sessionlist.html', sessions=sessionlist, name=name)

@app.route("/")
@app.route("/index")
def index():
    """
    """
    return redirect('/login')


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


