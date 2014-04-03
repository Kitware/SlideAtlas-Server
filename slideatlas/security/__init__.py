# coding=utf-8

from flask.ext.security import current_user, login_required, roles_accepted, roles_required

# TODO: setup and make flask.ext.login.fresh_login_required decorator available?

from .blueprint import register_with_app
