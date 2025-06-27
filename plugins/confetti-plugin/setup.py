from setuptools import setup
import os
import shutil
from deephaven.plugin.packaging import package_js

js_dir = "src/js/"
dest_dir = os.path.join("src/deephaven/confetti_plugin/_js")

package_js(js_dir, dest_dir)

setup(package_data={"deephaven.confetti_plugin._js": ["**"]})
