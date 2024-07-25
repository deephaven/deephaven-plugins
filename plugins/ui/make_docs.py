from __future__ import annotations

import os, sys

# Get the directory of the current file
current_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the path to the utilities module
utilities_path = os.path.join(current_dir, "../../sphinx_ext/")
sys.path.append(utilities_path)

from make_docs_utilities import build_documents, pushd

with pushd(__file__):
    build_documents()
