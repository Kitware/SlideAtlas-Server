
from flask import Blueprint, current_app, redirect, render_template, request, session, flash, url_for
from flaskext.openid import OpenID
from flask_oauth import OAuth

from .. import digitalpath
from slideatlas import model
from connections import slconn as conn

mod = Blueprint('login', __name__)
oid = OpenID()
oauth = OAuth()

# Facebook key redirecting to localhost:8080
FACEBOOK_APP_ID = '458796434162322'
FACEBOOK_APP_SECRET = '32cce59abab133519ccc51470c8b32f4'

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


@mod.route('/login.passwd', methods=['POST'])
def login_passwd():
    try:
        user = digitalpath.PasswordUser.objects.get(
            name=request.form['username']
            )
    except digitalpath.PasswordUser.DoesNotExist:
        print 'nonexistant username'
        return redirect('/index')
    if user.passwd != request.form['passwd']:
        print 'wrong password'
        return redirect('/index')
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
    print resp
    if resp is None:
        flash('Facebook Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        ), 'error')
        return redirect(url_for('home'))

    session['oauth_token'] = (resp['access_token'], '')
    me = facebook.get('/me')
    session['user'] = {
        'id': "Not_yet",
        'label': me.data['name'],
        'facebook_id': me.data['id']
        }
    flash('Logged in as id=%s name=%s redirect=%s' % \
          (me.data['id'], me.data['name'], request.args.get('next')), "success")

    return redirect(url_for('home'))

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
        print "OID Error"
        return redirect('/home')
    elif not oid_response:
        return oid.try_login(GOOGLE_IDENTITY_URL, ask_for=['email', 'fullname']) # 'nickname'
    else:
        # Check if the user exists 
        conn.register([model.User])
        dbobj = conn["slideatlasv2"]
        userdoc = dbobj["users"].User.fetch_one(
                                {'type' : 'google',
                                'name' : oid_response.email
                                })

        if userdoc == None:
            # Not found, create one 
            userdoc = dbobj["users"].User()
            userdoc["'type"] = 'google'
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

    flash('You were successfully logged in', 'success')
    return redirect('/home')


