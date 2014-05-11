# coding=utf-8

from bson import json_util, ObjectId
from flask import Flask
from flask.json import JSONEncoder
from flask.ext.bootstrap import Bootstrap

from .url_processing import add_url_converters, add_url_value_preprocessors

from celery import Celery
################################################################################
__all__ = ('create_app','create_celery_app')


################################################################################
def create_app(generate_docs=False):
    """
    Create the app and all of its functionality.

    :param generate_docs: (optional) Disable certain app functionality that may
        break when generating documentation.

    """
    app = Flask('slideatlas')

    load_default_config(app)
    load_site_config(app)
    add_config(app)

    add_url_converters(app)
    add_url_value_preprocessors(app)

    create_blueprints(app)

    # do this after site configuration is loaded
    if not generate_docs:
        setup_models(app)

    return app


################################################################################
def add_config(app):
    """
    Set Flask application configuration options.

    These are options that should never change.
    """
    # Flask configuration
    app.config.update(
        PREFERRED_URL_SCHEME = 'https' if app.config['SLIDEATLAS_HTTPS'] else 'http',

        SESSION_COOKIE_SECURE = app.config['SLIDEATLAS_HTTPS'],

        # The following options only apply if Flask sessions are configured
        #   to be permanent, which they presently are not
        # PERMANENT_SESSION_LIFETIME
        # SESSION_REFRESH_EACH_REQUEST
    )

    # Flask-Bootstrap configuration
    app.config.update(
        BOOTSTRAP_USE_MINIFIED=False
    )

    class BSONJSONEncoder(JSONEncoder):
        def default(self, obj):
            if isinstance(obj, ObjectId):
                return str(obj)
            return json_util.default(obj)

    app.json_encoder = BSONJSONEncoder


################################################################################
def create_blueprints(app):
    """
    Create and register all of the blueprints.

    Generally, this takes place by passing the app object to each blueprint's
    module, allowing the module to create and register all of its blueprints.

    Some blueprints require the app object to properly configure themselves, so
    passing the app in, as opposed to pulling a blueprint out, gives the most
    flexibility.
    """
    # TODO: Maybe change to using:
    #   http://flask.pocoo.org/docs/api/#flask.Blueprint.record
    #   http://flask.pocoo.org/docs/api/#flask.blueprints.BlueprintSetupState
    #  to setup blueprints internally

    # Bootstrap is used by several other blueprints
    Bootstrap(app)

    from slideatlas.core import views as core_views
    core_views.add_views(app)

    from slideatlas import security
    security.register_with_app(app)

    from slideatlas.views import tile
    app.register_blueprint(tile.mod)

    import glviewer
    app.register_blueprint(glviewer.mod)

    from slideatlas.views import sessions
    app.register_blueprint(sessions.mod)

    from slideatlas.views  import db_operations
    app.register_blueprint(db_operations.mod)

    from slideatlas.views import attachments
    app.register_blueprint(attachments.mod)

    from slideatlas.api import api
    app.register_blueprint(api.mod)

    from slideatlas.api import apiv2
    app.register_blueprint(apiv2.mod)


################################################################################
def load_default_config(app):
    """
    Load sensible defaults for all site-specific configuration options.
    """
    from slideatlas import default_config
    app.config.from_object(default_config)


################################################################################
def load_site_config(app):
    """
    Load site-specific configuration options from the path in the environment
    variable 'SLIDEATLAS_CONFIG_PATH'.
    """
    app.config.from_envvar('SLIDEATLAS_CONFIG_PATH', silent=True)


################################################################################
def setup_models(app):
    """
    Setup the models, particularly the connection with the admin database.
    """
    from slideatlas import models
    models.register_database(
        alias='admin_db',
        host=app.config['SLIDEATLAS_ADMIN_DATABASE_HOST'],
        replica_set=app.config['SLIDEATLAS_ADMIN_DATABASE_REPLICA_SET'],
        dbname=app.config['SLIDEATLAS_ADMIN_DATABASE_NAME'],
        username=app.config['SLIDEATLAS_ADMIN_DATABASE_USERNAME'],
        password=app.config['SLIDEATLAS_ADMIN_DATABASE_PASSWORD'],
        auth_db=app.config['SLIDEATLAS_ADMIN_DATABASE_AUTH_DB']
    )

################################################################################
def create_celery_app(app):
    """
    Setup celery for processing background tasks
    """
    # Use configuration from app

    mongo_url="mongodb://" + app.config['SLIDEATLAS_ADMIN_DATABASE_USERNAME'] + \
        ":" +  app.config['SLIDEATLAS_ADMIN_DATABASE_PASSWORD'] + "@" + app.config['SLIDEATLAS_ADMIN_DATABASE_HOST'] + \
        "/" +  app.config['SLIDEATLAS_ADMIN_DATABASE_NAME']

    # For testing
    # mongo_url = "mongodb://localhost:27001/celery"

    celery = Celery(app.import_name, broker=mongo_url)

    # TODO move this configuration to config files
    # celery.conf.update(app.config)
    celery.conf.update(
        CELERY_BROKER_URL = mongo_url,
        CELERY_ACCEPT_CONTENT = ["json"],
        # to avoid deprecation warning for pickle
        CELERY_RESULT_SERIALIZER = "json",
        CELERY_TASK_SERIALIZER = "json",
        CELERY_RESULT_BACKEND = mongo_url,
        CELERY_MONGODB_BACKEND_SETTINGS = {
            "host": mongo_url,
            "database" : app.config['SLIDEATLAS_ADMIN_DATABASE_NAME'],
            "taskmeta_collection":"taskmeta",
            "user" : app.config['SLIDEATLAS_ADMIN_DATABASE_USERNAME'],
            "password" : app.config['SLIDEATLAS_ADMIN_DATABASE_PASSWORD']
            },
        CELERY_BROKER_TRANSPORT_OPTIONS ={'replicaSet': app.config['SLIDEATLAS_ADMIN_DATABASE_REPLICA_SET']}
        )

    return celery
