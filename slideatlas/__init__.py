from flask import Flask, render_template


app = Flask(__name__)

@app.route("/")
@app.route('/<name>')

def hello(name=None):
    """
    All routes get redirected here 
    - / Says Hello <name>
    - /<name> Says Hello <name>
    """
    return render_template('hello.thtml', name=name)
