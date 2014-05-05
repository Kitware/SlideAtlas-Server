# coding=utf-8

# TODO: deprecate login_required
from flask.ext.security import current_user, login_required

# TODO: setup and make flask.ext.login.fresh_login_required decorator available?

from .blueprint import register_with_app
from .principal import *
