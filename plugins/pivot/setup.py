from setuptools import setup
import os
from deephaven.plugin.packaging import package_js

# js_dir is the directory where the JavaScript source files are located
js_dir = "src/js/"
# dest_dir is the directory where the JavaScript source files will be copied to in the package
dest_dir = os.path.join("src/deephaven/pivot/_js")

package_js(js_dir, dest_dir)

setup(package_data={"deephaven.pivot._js": ["**"]})
