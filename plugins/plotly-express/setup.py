import shutil
from setuptools import setup
import os

source_dir = "src/js/dist/bundle"
dest_dir = "src/js/plotly-express"

files = list(os.listdir(source_dir))

os.makedirs(dest_dir, exist_ok=True)

for file in files:
    source_path = os.path.join(source_dir, file)
    dest_path = os.path.join(dest_dir, file)
    shutil.copy(source_path, dest_path)

setup(package_data={"js.plotly-express": ["**"]})

shutil.rmtree("src/js/plotly-express")
