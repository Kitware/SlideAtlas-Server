# coding=utf-8

from flask import flash, redirect, request, session, url_for

from slideatlas import models
from .common import login_user, oauth

################################################################################
__all__ = ('register', 'login_facebook', 'login_facebook_authorized')

################################################################################
facebook = oauth.remote_app('facebook',
    base_url='https://graph.facebook.com/',
    request_token_url=None,
    access_token_url='/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    request_token_params={'scope': 'email,user_groups'},
    app_key='SLIDEATLAS_FACEBOOK_OAUTH'
)


################################################################################
def register(app, blueprint):
    app.config['SLIDEATLAS_FACEBOOK_OAUTH'] = {
        'consumer_key': app.config['SLIDEATLAS_FACEBOOK_APP_ID'],
        'consumer_secret': app.config['SLIDEATLAS_FACEBOOK_APP_SECRET']
    }
    oauth.init_app(app)


################################################################################
def login_facebook():
    return facebook.authorize(
        callback=url_for('.login_facebook_authorized',
                         next=request.args.get('next') or request.referrer or None,  # TODO: test this
                         _external=True)
    )


@facebook.authorized_handler
def login_facebook_authorized(resp=None):
    if resp is None:
        flash('Facebook Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        ), 'error')
        return redirect(url_for('home'))

    # TODO: How is 'oauth_token' used? Should it be removed from the session after login?
    session['oauth_token'] = (resp['access_token'], '')
    me = facebook.get('/me')

    # Get user from database
    user, created = models.FacebookUser.objects.get_or_create(email=me.data['email'], auto_save=False)
    if created:
        flash('New Facebook user account created', 'info')
    else:
        flash('Facebook user account exists', 'info')

    # Update user properties, in case Facebook has changed them
    user.full_name = me.data['name']
    # TODO: update Roles from Facebook groups
    user.save()

    return login_user(user)


@facebook.tokengetter
def login_facebook_get_oauth_token():
    return session.get('oauth_token')
