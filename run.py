# Development server
from slideatlas import create_app
from kill_flask import kill_flask

import logging
import sys
root = logging.getLogger()
root.setLevel(logging.INFO)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
root.addHandler(ch)

app = create_app()
app.run(host="0.0.0.0", port=8080, debug=True)

print "Done .."
