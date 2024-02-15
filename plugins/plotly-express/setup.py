import shutil
from setuptools import setup
import os
import subprocess

# Uses npm pack to create a tarball of the package and unpacks it into a build directory
# Then uses that to add to the wheel

js_dir = "src/js/"
dist_dir = os.path.join(js_dir, "dist")
build_dir = os.path.join(js_dir, "build")
dest_dir = os.path.join("src/deephaven/plot/express/_js")
package_dir = os.path.join(build_dir, "package")

# copy the bundle to the plotly-express directory
# the path may not exist (e.g. when running tests)
# so it is not strictly necessary to copy the bundle
if os.path.exists(dist_dir):
    # ignore errors as the directory may not exist
    shutil.rmtree(build_dir, ignore_errors=True)
    shutil.rmtree(dest_dir, ignore_errors=True)

    os.makedirs(build_dir, exist_ok=True)

    # pack and unpack into the js plotly-express directory
    subprocess.run(
        ["npm", "pack", "--pack-destination", "build"], cwd=js_dir, check=True
    )
    # it is assumed that there is only one tarball in the directory
    files = os.listdir(build_dir)
    for file in files:
        subprocess.run(["tar", "-xzf", file], cwd=build_dir, check=True)
        os.remove(os.path.join(build_dir, file))

    # move the package directory to the expected package location
    shutil.move(package_dir, dest_dir)

setup(package_data={"deephaven.plot.express._js": ["**"]})
