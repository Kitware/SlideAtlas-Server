# coding=utf-8

import logging
import os

import flask
from flask.ext.mail import Mail

################################################################################
__all__ = ()


################################################################################
def setup_mail(app):
    """
    Register Flask-Mail with app.
    """
    Mail(app)
    # TODO: set up a Celery task to send mail asynchronously; this can be integrated
    #   by creating a function that accepts 1 parameter, a flask.exe.mail.Message object,
    #   then passing that function to 'security.send_mail_task(<send_mail_func>)' to register it
    #   see https://pythonhosted.org/Flask-Security/customizing.html#emails-with-celery , but we
    #   would not use a decorator


################################################################################
def setup_logger(app):
    app.logger.addFilter(AddRequestFilter(app))
    # have the logger accept all messages; filtering will be done by handlers
    app.logger.setLevel(logging.DEBUG)

    # a handler to stderr is already setup by Flask if the app is in debug mode
    if not app.debug:
        setup_file_log_handler(app)
        setup_email_log_handler(app)


class AddRequestFilter(logging.Filter):
    DATA_MAX_SIZE = 10 * 1024

    def __init__(self, app):
        super(AddRequestFilter, self).__init__()
        self.server_name = app.config['SERVER_NAME']

    def filter(self, record):
        record.request_data_max_size_kb = self.DATA_MAX_SIZE / 1024
        record.server_name = self.server_name
        try:
            request = flask.request
            record.request_method = request.method
            record.request_remote_ip = request.remote_addr
            record.request_path = request.full_path
            record.request_referrer = request.referrer
            record.request_data = request.get_data(as_text=True)[:self.DATA_MAX_SIZE]
        except RuntimeError:
            record.request_method = None
            record.request_remote_ip = None
            record.request_path = None
            record.request_referrer = None
            record.request_data = None
        return 1


def setup_file_log_handler(app):
    log_base_path = app.config['SLIDEATLAS_LOG_PATH']
    if not os.path.exists(log_base_path):
        os.makedirs(log_base_path)

    file_formatter = logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s\n'
        '  Request Path: %(request_path)s\n'
        '  Remote IP: %(request_remote_ip)s\n'
        '  At: %(pathname)s:%(lineno)d\n'
    )

    error_file_handler = logging.FileHandler(
        os.path.join(log_base_path, 'slideatlas.error.log'))
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(file_formatter)
    app.logger.addHandler(error_file_handler)

    info_file_handler = logging.FileHandler(
        os.path.join(log_base_path, 'slideatlas.info.log'))
    info_file_handler.setLevel(logging.DEBUG)
    info_file_handler.setFormatter(file_formatter)
    app.logger.addHandler(info_file_handler)


def setup_email_log_handler(app):
        email_formatter = logging.Formatter(
            'Site:               %(server_name)s\n'
            'Message type:       %(levelname)s\n'
            'Location:           %(pathname)s:%(lineno)d\n'
            'Time:               %(asctime)s\n'
            '\n'
            'Request Type:       %(request_method)s\n'
            'Request Path:       %(request_path)s\n'
            'Request Referrer:   %(request_referrer)s\n'
            'Request IP:         %(request_remote_ip)s\n'
            'Request Body (first %(request_data_max_size_kb)sk):\n'
            '%(request_data)s\n'
            '\n'
            'Message:\n'
            '%(message)s\n'
        )

        warning_email_handler = MailHandler(app)
        warning_email_handler.setLevel(logging.ERROR)
        warning_email_handler.setFormatter(email_formatter)
        app.logger.addHandler(warning_email_handler)


################################################################################
class MailHandler(logging.Handler):
    def __init__(self, app):
        super(MailHandler, self).__init__()
        self.mail = app.extensions.get('mail')
        self.sender = app.config['SECURITY_EMAIL_SENDER']
        self.recipients = [app.config['SLIDEATLAS_ADMIN_EMAIL']]

    def emit(self, record):
        message_body = self.format(record)

        self.mail.send_message(
            subject='SlideAtlas: Site %s' % record.levelname,
            recipients=self.recipients,
            body=message_body,
            sender=self.sender,
        )
