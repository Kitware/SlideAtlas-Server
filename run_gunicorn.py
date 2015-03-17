# coding=utf-8

# Development server
from slideatlas import create_app
app = create_app()
# app.run(host='0.0.0.0', port=8080)

if __name__ == "__main__":
    print "To run:\ngunicorn run_gunicorn:app -b localhost:8080 -w 4"