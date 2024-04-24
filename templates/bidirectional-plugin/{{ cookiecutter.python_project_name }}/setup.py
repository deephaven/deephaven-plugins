from setuptools import setup
import os
from deephaven.plugin.packaging import package_js

js_dir = "src/js/"
dest_dir = os.path.join("src/{{cookiecutter.__src_folder_name}}/_js")

package_js(js_dir, dest_dir)

setup(package_data={"{{cookiecutter.__py_namespace}}._js": ["**"]})
