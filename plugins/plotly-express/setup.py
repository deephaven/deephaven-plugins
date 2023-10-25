import shutil
from setuptools import setup
import os
import subprocess
import json

# npm pack in js directory

js_dir = "src/js/"
dist_dir = os.path.join(js_dir, "dist")
project = "plotly-express"
dest_dir = os.path.join(js_dir, project, "")

# copy the bundle to the plotly-express directory
# the path may not exist (e.g. when running tests)
# so it is not strictly necessary to copy the bundle
if os.path.exists(dist_dir):
    os.makedirs(dest_dir, exist_ok=True)

    # pack and unpack into the js plotly-express directory
    subprocess.run(["npm", "pack", "--pack-destination", project], cwd=js_dir)
    # it is assumed that there is only one tarball in the directory
    files = os.listdir(dest_dir)
    for file in files:
        subprocess.run(["tar", "-xzf", file], cwd=dest_dir)
        os.remove(os.path.join(dest_dir, file))

    # move the contents of the package directory to the plotly-express directory
    package_dir = os.path.join(dest_dir, "package")
    files = os.listdir(package_dir)
    for file in files:
        source_path = os.path.join(package_dir, file)
        dest_path = os.path.join(dest_dir, file)
        shutil.move(source_path, dest_path)

setup(package_data={"js.plotly-express": ["**"]})

# ignore errors as the directory may not exist
shutil.rmtree("src/js/plotly-express", ignore_errors=True)
