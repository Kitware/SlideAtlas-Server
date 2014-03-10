# coding=utf-8

from wtforms import TextField
from flask.ext.security.forms import ConfirmRegisterForm as _ConfirmRegisterForm

################################################################################
__all__= ('ConfirmRegisterForm',)


################################################################################
class ConfirmRegisterForm(_ConfirmRegisterForm):
    full_name = TextField('Your Full Name')  # TODO: validator
