# coding=utf-8

from wtforms import TextField
from flask.ext.security.forms import _datastore, Form, RegisterFormMixin, \
    NewPasswordFormMixin, PasswordConfirmFormMixin, UniqueEmailFormMixin
from flask.ext.security.forms import LoginForm as SecurityLoginForm
from flask.ext.security.utils import get_message, verify_and_update_password

from slideatlas import models

################################################################################
__all__ = ()


################################################################################
class RegisterForm(Form, RegisterFormMixin, UniqueEmailFormMixin):
    full_name = TextField('Your Full Name')  # TODO: validator


################################################################################
class ConfirmEmailForm(Form, RegisterFormMixin, NewPasswordFormMixin,
                       PasswordConfirmFormMixin):
    pass


################################################################################
class LoginForm(SecurityLoginForm):
    def validate(self):
        # this is a temporary fix to allow login to accounts with empty
        #   passwords; this should not be permitted generally.
        if self.password.data.strip() == '':
            self.password.data = '_empty_'

        # skip calling parent's validate, but do call parent's parent
        if not super(SecurityLoginForm, self).validate():
            return False

        if self.email.data.strip() == '':
            self.email.errors.append(get_message('EMAIL_NOT_PROVIDED')[0])
            return False

        # TODO: this will become functional once empty passwords are disallowed
        if self.password.data.strip() == '':
            self.password.errors.append(get_message('PASSWORD_NOT_PROVIDED')[0])
            return False

        self.user = _datastore.get_user(self.email.data)

        if self.user is None:
            self.email.errors.append(get_message('USER_DOES_NOT_EXIST')[0])
            return False
        # this is changed from upstream, to make non-PasswordUsers fail early
        #   and reliably
        if not isinstance(self.user, models.PasswordUser):
            self.password.errors.append(get_message('PASSWORD_NOT_SET')[0])
            return False
        # this is changed from upstream, to fail due to unconfirmed before
        #   checking for wrong password, to ensure a better error message
        if self.user.confirmed_at is None:
            self.email.errors.append(get_message('CONFIRMATION_REQUIRED')[0])
            return False
        if not verify_and_update_password(self.password.data, self.user):
            self.password.errors.append(get_message('INVALID_PASSWORD')[0])
            return False
        if not self.user.is_active():
            self.email.errors.append(get_message('DISABLED_ACCOUNT')[0])
            return False
        return True
