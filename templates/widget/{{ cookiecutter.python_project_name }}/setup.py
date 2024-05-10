from setuptools import setup
import shutil
import os
from deephaven.plugin.packaging import package_js

# remove the build directory to ensure that the package is built from the latest js files
try:
    shutil.rmtree("build")
except FileNotFoundError:
    pass

# js_dir is the directory where the JavaScript source files are located
js_dir = "src/js/"
# dest_dir is the directory where the JavaScript source files will be copied to in the package
dest_dir = os.path.join("src/{{cookiecutter.__src_folder_name}}/_js")

package_js(js_dir, dest_dir)

setup(package_data={"{{cookiecutter.__py_namespace}}._js": ["**"]})
