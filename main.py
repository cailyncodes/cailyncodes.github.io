#! /usr/bin/env python3

import mimetypes
from flask import Flask, send_from_directory, send_file

app = Flask(__name__)

@app.route("/")
@app.route("/<path:path>")
def index(path=None):
    path = str(path)
    mimetype = mimetypes.guess_type(path)[0]

    if any([path.startswith(prefix) for prefix in ["layout", "assets", "content"]]):
        if mimetype is None:
            mimetype = "text/html"
        return send_from_directory(".", path, mimetype=mimetype)

    if path == "home.md" or path == "not-found.html":
        return send_from_directory(".", path, mimetype=mimetype)

    return send_file("index.html", mimetype="text/html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)