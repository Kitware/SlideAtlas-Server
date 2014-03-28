# coding=utf-8

import os.path

from flask import current_app, render_template, send_from_directory

from slideatlas.version import get_git_name

################################################################################
__all__ = ('add_views',)


################################################################################
def add_views(app):
    app.add_url_rule(rule='/', view_func=home)
    app.add_url_rule(rule='/home', view_func=home, alias=True)

    app.add_url_rule(rule='/status', view_func=status)

    app.add_url_rule(rule='/favicon.ico', view_func=favicon)


################################################################################
def home():
    return render_template('home.html')


################################################################################
def status():
    return render_template('status.html',
                           git=get_git_name(),
                           host=current_app.config['SERVER_NAME'])


################################################################################
def favicon():
    return send_from_directory(os.path.join(current_app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')
