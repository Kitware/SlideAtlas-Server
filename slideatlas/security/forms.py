# coding=utf-8

from wtforms import TextField
from flask.ext.security.forms import ConfirmRegisterForm as _ConfirmRegisterForm
from flask.ext.security.forms import LoginForm as _LoginForm

################################################################################
__all__= ('ConfirmRegisterForm', 'LoginForm')


################################################################################
class ConfirmRegisterForm(_ConfirmRegisterForm):
    full_name = TextField('Your Full Name')  # TODO: validator


class LoginForm(_LoginForm):
    def validate(self):
        """
        This is a temporary fix to allow login to accounts with apparently with
        empty passwords. This should not be permitted generally.
        """
        if self.password.data.strip() == '':
            self.password.data = '_empty_'
        return super(LoginForm, self).validate()
