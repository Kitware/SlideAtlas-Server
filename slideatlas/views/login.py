
from flask import Blueprint, current_app, redirect, render_template, request, session
from flaskext.openid import OpenID

from .. import digitalpath

mod = Blueprint('login', __name__)
oid = OpenID()

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
    # NYI
    return redirect('/index')


@mod.route('/login.google')
@oid.loginhandler
@oid.after_login
def login_google(oid_response=None):
    """Does the login via OpenID.
    """
    GOOGLE_IDENTITY_URL = 'https://www.google.com/accounts/o8/id'

    if oid.fetch_error():
        print "OID Error"
        return redirect('/index')
    elif not oid_response:
        return oid.try_login(GOOGLE_IDENTITY_URL, ask_for=['email', 'fullname']) # 'nickname'
    else:
        user = digitalpath.GoogleUser.objects.get_or_create(
            name=oid_response.email,
            defaults={
                'name': oid_response.email,
                'label': oid_response.fullname
                }
            )[0]
        return do_user_login(user)


def do_user_login(user):

    user.update_last_login()

    session['user'] = {
        'id': user.id,
        'label': user.label,
        }
    session['last_activity'] = user.last_login

    return redirect('/session-index')


