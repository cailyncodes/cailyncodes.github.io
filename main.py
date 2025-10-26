#! /usr/bin/env python3

import mimetypes
import os
import time

from flask import Flask, send_from_directory, send_file

app = Flask(__name__)

mode = os.getenv("MODE")

cwd = os.getcwd()

@app.route("/")
@app.route("/<path:path>")
def index(path=None):
    if path is None:
        path = ""
    
    mimetype = mimetypes.guess_type(path)[0]

    if mode == "slow" and "css" not in path:
        time.sleep(0.2)

    # send from directory if the path ends with .css, .js, or .map
    if any([path.endswith(suffix) for suffix in [".css", ".js", ".map", ".ico"]]):
        if mimetype is None:
            mimetype = "text/html"
        return send_from_directory(cwd, path, mimetype=mimetype)

    # send from directory if the path is home.md or not-found.html
    if path == "home.md" or path == "not-found.html":
        return send_from_directory(cwd, path, mimetype=mimetype)

    # send from directory if the path starts with a directory in the dist/ folder
    directories = [d for d in os.listdir(os.path.join(cwd)) if os.path.isdir(os.path.join(cwd, d))]
    if any([path.startswith(d) for d in directories]):
        if "." not in path:
            path = path + "/index.html"
        return send_file(os.path.join(cwd, path), mimetype=mimetype)

    return send_file(os.path.join(cwd, "index.html"), mimetype="text/html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)