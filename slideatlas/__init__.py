from flask import Flask, render_template, escape
from flask.ext.bootstrap import Bootstrap

app = Flask(__name__)
Bootstrap(app)

app.config['BOOTSTRAP_USE_MINIFIED'] = False

@app.route("/")
@app.route('/<name>')
def hello(name=None):
    """
    All routes get redirected here 
    - / Says Hello <name>
    - /<name> Says Hello <name>
    """
    return render_template('hello.html', name=name)
