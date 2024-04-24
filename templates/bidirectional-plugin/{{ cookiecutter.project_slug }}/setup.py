from setuptools import setup
import os
from deephaven.plugin.packaging import package_js

js_dir = "src/js/"
dest_dir = os.path.join("src/{{cookiecutter.py_folder_name}}/_js")

package_js(js_dir, dest_dir)

setup(package_data={"{{cookiecutter.py_namespace}}._js": ["**"]})
