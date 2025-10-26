#!/usr/bin/env -S uv run --active --script

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
    if mimetype is None:
        mimetype = "text/html"

    if mode == "slow" and "css" not in path:
        time.sleep(0.2)

    # send from directory if the path ends with .css, .js, or .map
    if any([path.endswith(suffix) for suffix in [".css", ".js", ".map", ".ico", ".md"]]):
        return send_from_directory(cwd, path, mimetype=mimetype)

    if any([path.startswith(suffix) for suffix in ["content", "layout", "assets"]]):
        return send_file(os.path.join(cwd, path), mimetype=mimetype)

    # if the path is not-found, send the not-found.html file
    if path == "not-found":
        return send_file(os.path.join(cwd, "not-found.html"), mimetype="text/html")

    # for all layers of files in the cwd, if the path matches the file path, send the file
    for root, dirs, files in os.walk(cwd):
        for file in files:
            # if the root minus the cwd equals the path, send the file
            if root.replace(cwd + "/", "") == path and file.endswith(".html"):
                    return send_file(os.path.join(root, file), mimetype="text/html")

    return send_file(os.path.join(cwd, "index.html"), mimetype="text/html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)