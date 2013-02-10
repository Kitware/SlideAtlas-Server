
from flask import Blueprint, redirect, render_template, request, session, flash, url_for, current_app
from flask_openid import OpenID
from flask_oauth import OAuth

from slideatlas import model
from slideatlas  import slconn as conn

mod = Blueprint('login', __name__)
oid = OpenID()
oauth = OAuth()

# Facebook key redirecting to localhost:8080
FACEBOOK_APP_ID = '119067998250051'
FACEBOOK_APP_SECRET = 'a59f02dfa257a385273f22ed061257e4'

facebook = oauth.remote_app('facebook',
    base_url='https://graph.facebook.com/',
    request_token_url=None,
    access_token_url='/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    consumer_key=FACEBOOK_APP_ID,
    consumer_secret=FACEBOOK_APP_SECRET,
    request_token_params={'scope': 'email'}
)

@mod.route("/login")
def login():
    """
    """
    return render_template('login.html')


@mod.route('/login.passwd', methods=['GET', 'POST'])
def login_passwd():
    # Try to find the user
    conn.register([model.User])
    admindb = conn[current_app.config["CONFIGDB"]]

    user = admindb["users"].User.find_one({"name" : request.form['username']})
    if user == None:
        flash('User not found ' + request.form['username'], "error")
        return redirect('/home')
    if user["passwd"] != request.form['passwd']:
        flash('Authentication', "error")
        return redirect('/home')
    else:
        return do_user_login(user)

@mod.route('/login.facebook')
def login_facebook():
    return facebook.authorize(callback=url_for('.facebook_authorized',
        next=request.args.get('next') or request.referrer or None,
        _external=True))

@mod.route('/facebook_authorized')
@facebook.authorized_handler
def facebook_authorized(resp=None):
    if resp is None:
        flash('Facebook Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        ), 'error')
        return redirect(url_for('home'))

    session['oauth_token'] = (resp['access_token'], '')
    me = facebook.get('/me')

    # Check if the user exists
    conn.register([model.User])
    dbobj = conn[current_app.config["CONFIGDB"]]
    userdoc = dbobj["users"].User.fetch_one(
                            {'type' : 'facebook',
                            'name' : me.data['email']
                            })

    if userdoc == None:
        # Not found, create one
        userdoc = dbobj["users"].User()
        userdoc["type"] = 'facebook'
        userdoc["name"] = me.data['email']
        userdoc["label"] = me.data['name']
        userdoc.save()
        flash('New facebook user account created', 'info')
    else:
        pass
        flash('Facebook account exists', 'info')

    return do_user_login(userdoc)

@facebook.tokengetter
def get_facebook_oauth_token():
    return session.get('oauth_token')

@mod.route('/login.google')
@oid.loginhandler
@oid.after_login
def login_google(oid_response=None):
    """Does the login via OpenID.
    """
    GOOGLE_IDENTITY_URL = 'https://www.google.com/accounts/o8/id'

    if oid.fetch_error():
        flash("OpenID Error")
        return redirect('/home')
    elif not oid_response:
        return oid.try_login(GOOGLE_IDENTITY_URL, ask_for=['email', 'fullname']) # 'nickname'
    else:
        # Check if the user exists
        conn.register([model.User])
        dbobj = conn[current_app.config["CONFIGDB"]]
        userdoc = dbobj["users"].User.fetch_one(
                                {'type' : 'google',
                                'name' : oid_response.email
                                })

        if userdoc == None:
            # Not found, create one
            userdoc = dbobj["users"].User()
            userdoc["type"] = 'google'
            userdoc["name"] = oid_response.email
            userdoc["label"] = oid_response.fullname
            userdoc.save()
            #flash('New user account created', 'info')
        else:
            pass
            #flash('Account exists', 'info')

        return do_user_login(userdoc)

def do_user_login(user):
    """
    Accepts a Mongokit document
    """

    user.update_last_login()
    user.save()
    #flash(str(user))

    session['user'] = {
        'id': user["_id"],
        'label': user["label"],
        'email' : user["name"]
        }
    session['last_activity'] = user["last_login"]

    # Also add the rules information to the session
    # Loop over the rules

    for arule in user["rules"]:
        ruleobj =

    flash('You were successfully logged in', 'success')
    return redirect('/home')


