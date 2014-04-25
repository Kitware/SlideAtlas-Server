# Development server
from slideatlas import create_app
from kill_flask import kill_flask

app = create_app()
app.run(host="0.0.0.0", port=8080, debug=True)

print "Done .."
