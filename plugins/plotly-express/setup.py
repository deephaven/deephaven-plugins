import shutil
from setuptools import setup
import os

source_dir = "src/js/dist/bundle"
dest_dir = "src/js/plotly-express"

# copy the bundle to the plotly-express directory
# the path may not exist (e.g. when running tests)
# so it is not strictly necessary to copy the bundle
if os.path.exists(source_dir):
    files = list(os.listdir(source_dir))

    os.makedirs(dest_dir, exist_ok=True)

    for file in files:
        source_path = os.path.join(source_dir, file)
        dest_path = os.path.join(dest_dir, file)
        shutil.copy(source_path, dest_path)

setup(package_data={"js.plotly-express": ["**"]})

# ignore errors as the directory may not exist
shutil.rmtree("src/js/plotly-express", ignore_errors=True)
