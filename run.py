# Development server
from slideatlas import app, celery
from kill_flask import kill_flask

app.run(host="0.0.0.0", port=8080, debug=True)

print "Done .."
