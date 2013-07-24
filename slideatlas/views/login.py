
import flask
from flask import Blueprint, redirect, render_template, request, session, flash, url_for, current_app
from flask_openid import OpenID
from flask_oauth import OAuth
import smtplib
from email.mime.text import MIMEText

from slideatlas.common_utils import DBAccess, nicepass
import bson

from slideatlas import model, app
from slideatlas  import slconn as conn


mod = Blueprint('login', __name__)
oid = OpenID()
oauth = OAuth()

# Facebook key redirecting to localhost:8080

facebook = oauth.remote_app('facebook',
    base_url='https://graph.facebook.com/',
    request_token_url=None,
    access_token_url='/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    consumer_key=app.config['FACEBOOK_APP_ID'],
    consumer_secret=app.config['FACEBOOK_APP_SECRET'],
    request_token_params={'scope': 'email'}
)

@mod.route("/login")
def login():
    """
    Displays various login options, including signup
    """
    return render_template('login.html')

@mod.route("/login.signup", methods=['GET', 'POST'])
def login_signup():
    """
    "Displays the signup template when getting
    else processes signup request when posting
    """
    if request.method == "POST":
        name = request.form["name"]
        emailto = request.form["email"]

        # Check whether that user exists
        conn.register([model.User])
        admindb = conn[current_app.config["CONFIGDB"]]

        user = admindb["users"].User.find_one({"name" : emailto, "type" : "passwd"})

        if user != None:
            return flask.Response("{\"error\" :  \"User exists\"}")

        # Create accout and a random tocken
        token = bson.ObjectId()

        # Not found, create one
        userdoc = admindb["users"].User()
        userdoc["type"] = 'passwd'
        userdoc["name"] = emailto
        userdoc["label"] = name
        userdoc["token"] = token
        userdoc["confirmed"] = False
        userdoc.validate()
        userdoc.save()

        # Create email
        emailfrom  = "dhanannjay.deo@kitware.com"

        body = "Hello " + name + ",\n"
        body = body + "You recently created a new account at https://slide-atlas.org.  To proceed with your account creation please follow the link below:\n"
        body = body + "\n     " + url_for('.login_confirm', external=True) + "?token=" + str(token) + " \n"
        body = body + "\nIf clicking on the link doesn't work, try copying and pasting it into your browser.\n"
        body = body + "\nThis link will work only once, and will let you create a new password. \n"
        body = body + "\nIf you did not enter this address as your contact email, please disregard this message.\n"
        body = body + "\nThank you,\nThe SlideAtlas Administration Team\n"

        # Create a text/plain message
        msg = MIMEText(body)

        # me == the sender's email address
        # you == the recipient's email address
        msg['Subject'] = 'Account email confirmation for slide-atlas.org'
        msg['From'] = emailfrom
        msg['To'] = emailto
        s = smtplib.SMTP('public.kitware.com')
        try:
            out = s.sendmail(emailfrom, [emailto], msg.as_string())
        except:
            return flask.Response("{\"error\" :  \"Error sending email\"}")

        s.quit()
        return flask.Response("{\"success\" :  \"" + str(out) + "\"}")
    else:
        # Only two methods supported
        return render_template('signup.html')

@mod.route("/login.confirm")
def login_confirm():
    """
    End point after login creation or password reset requests
    Verifies that the request is legitimate and when in good standing
    follows up with password reset
    Logs the user in
    """
    token = bson.ObjectId(request.args["token"])

    # Check whether that user exists
    conn.register([model.User])
    admindb = conn[current_app.config["CONFIGDB"]]

    user = admindb["users"].User.find_one({"token" : token})

    if user == None:
        flash("Confirmation link expired or invalid", "error")
        return redirect('/home')

    # Remove the token
    del user["token"]
    del user["confirmed"]
    user["password_status"] = "reset"

    user.save()

    flash("Success, Please reset the password", "success")
    return redirect('/login.reset')

@mod.route('/login.reset.request', methods=['GET', 'POST'])
def login_resetrequest():
    """
    End point for password reset request
    Asks user for a valid email and posts back, if the account exists, sends out email for password reset.
    Follows up with login.signup if an account for that email is not found, or
    login.confirm if the valid account is found.
    """
    if request.method == "GET":
        # In browser request that user wants to reset the password
        return flask.render_template('reset-request.html', message="Please reset the password")

    if request.method == "POST":
        # Create a token
        email = flask.request.form["email"]

        # Find if an account with that name exists
        conn.register([model.User])
        admindb = conn[current_app.config["CONFIGDB"]]

        userdoc = admindb["users"].User.find_one({"name" : email, "type" : "passwd"})
        if userdoc == None:
            # user not found
            return flask.Response('{"error" : "User not found"}')

        # First reset the password
        name = userdoc["label"]
        emailto = userdoc["name"]

        # Create accout and a random tocken
        userdoc["token"] = bson.ObjectId()
        userdoc["password_ready"] = False

        userdoc.validate()
        userdoc.save()

        # Create email
        emailfrom  = "dhanannjay.deo@kitware.com"

        body = "Hello " + name + ",\n"
        body = body + "You recently requested a password reset for your account at https://slide-atlas.org."
        body = body + "\n To complete the request operation please follow the link below- \n"
        body = body + "\n     " + url_for('.login_confirm', _external=True) + "?token=" + str(userdoc["token"]) + " \n"
        body = body + "\nIf clicking on the link doesn't work, try copying and pasting it into your browser.\n"
        body = body + "\nThis link will work only once, and will let you create a new password. \n"
        body = body + "\nIf you did not request password reset, please disregard this message.\n"
        body = body + "\nThank you,\nThe SlideAtlas Administration Team\n"

        # Create a text/plain message
        msg = MIMEText(body)

        # me == the sender's email address
        # you == the recipient's email address
        msg['Subject'] = 'Password reset confirmation for slide-atlas.org'
        msg['From'] = emailfrom
        msg['To'] = emailto
        print msg
        s = smtplib.SMTP('public.kitware.com')
        try:
            out = s.sendmail(emailfrom, [emailto], msg.as_string())
        except:
            return flask.Response("{\"error\" :  \"Error sending email\"}")

        s.quit()
        return flask.Response("{\"success\" :  \"" + str(out) + "\"}")


@mod.route('/login.reset', methods=['GET', 'POST'])
def login_reset():
    """
    Asks user for a password and its match. Posts back in the same session.
    Updates the password state in the currently logged in user
    User must be logged in already (generally by login.confirm)
    """

    if request.method == "GET":
        # In browser request that user wants to reset the password
        # Create a token
        # Send out an email
        #
        return flask.render_template('profile.html', message="Please reset the password")

    if request.method == "POST":
        # In browser request that user wants to reset the password
        return flask.render_template('profile.html', message="Please reset the password")


@mod.route('/login.passwd', methods=['GET', 'POST'])
def login_passwd():
    """
    Processes login request.
    Logs the user tryign to login with valid password.
    follows up with do_user_login
    """
    conn.register([model.User])
    admindb = conn[current_app.config["CONFIGDB"]]

    user = admindb["users"].User.find_one({"name" : request.form['username'], "type" : "passwd"})
    if user == None:
        flash('User not found ' + request.form['username'], "error")
        return redirect('/home')
    if "confirmed" in user:
        if user["confirmed"] == False:
            flash('Account email confirmation required', "error")
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

@mod.route('/login.google', methods=["GET", "POST"])
@oid.loginhandler
@oid.after_login
def login_google(oid_response=None):
    """Does the login via OpenID.
    """
    GOOGLE_IDENTITY_URL = 'https://www.google.com/accounts/o8/id'

    if oid.fetch_error():
        flash("OpenId Error: " + str(oid.fetch_error()), "error")
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
#            flash('New user account created', 'info')
        else:
            pass
#            flash('Existing account located', 'info')

        return do_user_login(userdoc)



def do_user_login(user):
    """
    Accepts a Mongokit document
    """
    conn.register([model.Rule])
    admindb = conn[current_app.config["CONFIGDB"]]
    user.update_last_login()
    user.save()

    session['user'] = {
        'id': user["_id"],
        'label': user["label"],
        'email' : user["name"],
        }
    session['site_admin'] = False
    session['last_activity'] = user["last_login"]
    # Also add the rules information to the session
    # Loop over the rules
    accesses = { }
    for arule in user["rules"]:
        ruleobj = admindb["rules"].Rule.find_one({"_id" : arule})
        if ruleobj == None:
            flash("Rule not found !! " + str(arule), "error")
            continue

        # Create empty DBAccess for that db
        if not str(ruleobj["db"]) in accesses.keys():
            accesses[str(ruleobj["db"])] = DBAccess()

        if 'db_admin' in ruleobj and ruleobj["db_admin"] == True:
            accesses[str(ruleobj["db"])].db_admin = True
        if 'can_see_all' in ruleobj and ruleobj["can_see_all"] == True:
            accesses[str(ruleobj["db"])].can_see_all = True
        if 'can_see' in ruleobj:
            if len(ruleobj["can_see"]) > 0:
                accesses[str(ruleobj["db"])].can_see.append(ruleobj["can_see"])
        if 'site_admin' in ruleobj and ruleobj["site_admin"] == True:
            session["site_admin"] = True

    # Insert that information in the session
    # In future, session may contain only session it,
    # and this could get into database

#    For debugging
#    for adb in accesses.keys():
#        flash(adb + ": " + str(accesses[adb]), "info")
#
#    flash("Site admin : " + str(session["site_admin"]), "info")


    flash('You were successfully logged in. ', 'success')
    return redirect('/home')
