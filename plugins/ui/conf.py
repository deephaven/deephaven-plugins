# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html
import os
import sys

sys.path.append(os.path.abspath("../../sphinx_ext"))

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "deephaven"
copyright = "2024, Deephaven Data Labs"
author = "Deephaven Data Labs"
# we don't use release but sphinx requires it
release = "0.1.0"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "myst_parser",
    "sphinx.ext.autodoc",
    "sphinx.ext.napoleon",
    "deephaven_markdown_translator",
    "sphinx_markdown_builder",
    "sphinx_autodoc_typehints",
    "deephaven_autodoc",
    "deephaven_code_block",
]

source_suffix = [".rst", ".md"]  # Can use either rst or markdown files as input

# show hints in the description so that the function definition is not cluttered
autodoc_typehints = "description"

# exclude build directory
exclude_patterns = ["build", "Thumbs.db", ".DS_Store"]

# options for sphinx_autodoc_typehints
always_use_bars_union = True

strip_signature_backslash = True

from deephaven_server import Server

myst_all_links_external = True

# need a server instance to pull types from the autodocs
Server(port=10075)
