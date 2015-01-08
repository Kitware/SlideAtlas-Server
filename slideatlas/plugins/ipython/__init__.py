# Create a blueprint
import flask

mod = flask.Blueprint('ipython', __name__, static_folder='static', url_prefix="/ipython")

