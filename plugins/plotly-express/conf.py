# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html
import os
import sys

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "deephaven"
copyright = "2024, Deephaven Data Labs"
author = "Deephaven Data Labs"
release = "0.7.0"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

# monkey patch to remove literal_emphasis rendering - it doesn't work well with type hints
from sphinx_markdown_builder.translator import PREDEFINED_ELEMENTS

PREDEFINED_ELEMENTS["literal_emphasis"] = None

extensions = [
    "myst_parser",
    "sphinx.ext.autodoc",
    "sphinx.ext.napoleon",
    "sphinx_markdown_builder",
]

source_suffix = [".rst", ".md"]  # Can use either rst or markdown files as input

# show hints in the description so that the function definition is not cluttered
autodoc_typehints = "description"

# exclude build directory
exclude_patterns = ["build", "Thumbs.db", ".DS_Store"]

from deephaven_server import Server

s = Server(port=10075)
s.start()
