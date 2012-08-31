from flask import Flask, render_template


app = Flask(__name__)

@app.route("/")
@app.route('/<name>')
def hello(name=None):
    return render_template('hello.thtml', name=name)
