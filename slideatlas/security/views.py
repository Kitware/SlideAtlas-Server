# coding=utf-8

from flask import redirect, render_template, request
from flask.ext.security import current_user
from flask.ext.security.confirmable import confirm_email_token_status, \
    confirm_user, send_confirmation_instructions
from flask.ext.security.decorators import anonymous_user_required
from flask.ext.security.registerable import register_user
from flask.ext.security.utils import config_value, do_flash, get_message, \
    get_post_register_redirect, get_url, login_user, logout_user, \
    url_for_security
from flask.ext.security.views import _ctx, _render_json, _security
from werkzeug.datastructures import MultiDict

from . import forms

################################################################################
__all__ = ()


################################################################################
@anonymous_user_required
def register():
    """View function which handles a registration request."""

    if request.json:
        form_data = MultiDict(request.json)
    else:
        form_data = request.form

    form = forms.RegisterForm(form_data)

    if form.validate_on_submit():
        # 'register_user' expects a 'password' argument to be provided; it's
        #   simpler to just provide an empty password than reimplement the
        #   entire rest of the function locally
        user = register_user(password=None, **form.to_dict())
        if user.password is not None:
            # if the password encryption is not plaintext, the password of
            #   'None' will have been encrypted to some string
            user.password = None
            user.save()
        form.user = user

        if not request.json:
            return redirect(get_post_register_redirect())
        return _render_json(form, include_auth_token=True)

    if request.json:
        return _render_json(form)

    return render_template(config_value('REGISTER_USER_TEMPLATE'),
                           register_user_form=form,
                           **_ctx('register'))


################################################################################
def confirm_email(token):
    """View function which handles a email confirmation request."""

    expired, invalid, user = confirm_email_token_status(token)

    if not user or invalid:
        invalid = True
        do_flash(*get_message('INVALID_CONFIRMATION_TOKEN'))
    if expired:
        send_confirmation_instructions(user)
        do_flash(*get_message('CONFIRMATION_EXPIRED', email=user.email,
                              within=_security.confirm_email_within))
    if invalid or expired:
        return redirect(get_url(_security.confirm_error_view) or
                        url_for_security('send_confirmation'))
    if user.confirmed_at is not None:
        do_flash(*get_message('ALREADY_CONFIRMED'))
        return redirect(get_url(_security.post_confirm_view) or
                        get_url(_security.post_login_view))

    if request.json:
        form_data = MultiDict(request.json)
    else:
        form_data = request.form
    form = forms.ConfirmEmailForm(form_data)

    if form.validate_on_submit():
        user.password = form.password.data
        confirm_user(user)  # this saves 'user'
        if user != current_user:
            logout_user()
            login_user(user)
        do_flash(*get_message('EMAIL_CONFIRMED'))
        return redirect(get_url(_security.post_confirm_view) or
                        get_url(_security.post_login_view))

    return render_template('security/confirm.html',
                           token=token,
                           confirm_form=form,
                           **_ctx('change_password')
    )
