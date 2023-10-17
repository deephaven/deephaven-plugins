import shutil
from setuptools import setup
import os
import subprocess
import json

# npm pack in js directory

js_dir = "src/js/"
dist_dir = js_dir + "dist"
project = "plotly-express"
dest_dir = js_dir + project + "/"

# index directory relative to location of package_info.json
index_file = "package/dist/bundle/index.js"

# metadata file to point to index.js location, as it may vary
package_info_file = dest_dir + "package_info.json"
package_info = {"main": index_file}

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

    # write package_info.json to dest_dir
    with open(os.path.join(dest_dir, "package_info.json"), "w") as f:
        json.dump(package_info, f)

setup(package_data={"js.plotly-express": ["**"]})

# ignore errors as the directory may not exist
shutil.rmtree("src/js/plotly-express", ignore_errors=True)
