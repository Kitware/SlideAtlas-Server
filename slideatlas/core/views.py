# coding=utf-8

import os.path

from flask import current_app, render_template, send_from_directory

from slideatlas.version import get_version

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
    site = {
        'version': get_version()
    }
    admin_db = {
        'host': current_app.config['SLIDEATLAS_ADMIN_DATABASE_HOST'],
        'replica_set': current_app.config['SLIDEATLAS_ADMIN_DATABASE_REPLICA_SET'],
        'name': current_app.config['SLIDEATLAS_ADMIN_DATABASE_NAME']
    }
    return render_template('status.html',
                           site=site,
                           admin_db=admin_db)


################################################################################
def favicon():
    return send_from_directory(os.path.join(current_app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')
