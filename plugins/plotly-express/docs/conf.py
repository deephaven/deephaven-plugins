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

extensions = [
    "myst_parser",
    "sphinx_markdown_builder",
    "sphinx.ext.autodoc",
    "sphinx.ext.napoleon",
]

python_maximum_signature_line_length = 20

source_suffix = [".rst", ".md"]  # Can use either rst or markdown files as input

root_doc = "README"

suppress_warnings = ["myst.header"]

# exclude build directory
exclude_patterns = ["build", "Thumbs.db", ".DS_Store"]

from deephaven_server import Server

s = Server(port=10075)
s.start()

# Sphinx - need py 3.9 for latest versions for python_maximum_signature_line_length
# myst-parser
# sphinx-markdown-builder
# deephaven-server
# dx wheel
