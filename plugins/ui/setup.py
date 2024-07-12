from setuptools import setup
import os
import shutil
from deephaven.plugin.packaging import package_js

js_dir = "src/js/"
dest_dir = os.path.join("src/deephaven/ui/_js")

# remove the build/dist directory to ensure that the package is built from the latest js files
try:
    shutil.rmtree("build")
    shutil.rmtree("dist")
except FileNotFoundError:
    pass

package_js(js_dir, dest_dir)

setup()
