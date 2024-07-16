from __future__ import annotations

import os
import contextlib
from typing import IO, Generator

BUILT_DOCS = "docs/build/markdown"


@contextlib.contextmanager
def pushd(
    file: str,
) -> Generator[None, None, None]:
    """
    Change to the provided script directory, and return to the original directory when done.

    Args:
        file: The file to change to the directory of
    """
    # save original directory so we can return to it
    cwd = os.getcwd()

    # change to the directory of this file
    dirname = os.path.dirname(file)
    if dirname:
        os.chdir(dirname)

    try:
        yield
    finally:
        # ensure we always return to the original directory, even if an exception is raised
        os.chdir(cwd)


def md_files() -> Generator[str, None, None]:
    """
    Walk the built docs directory and yield the path to each markdown file.

    Returns:
        Generator[str, None, None]: The path to each markdown file.
    """
    for root, dirs, files in os.walk(BUILT_DOCS):
        for file in files:
            if file.endswith(".md"):
                yield os.path.join(root, file)


def md_lines() -> Generator[tuple[IO, str], None, None]:
    """
    Open each markdown file and yield the file object and each line in the file.

    Returns:
        Generator[tuple[IO, str], None, None]: The file object and each line in the file.
    """
    for file in md_files():
        with open(file, "r") as f:
            lines = f.readlines()
        with open(file, "w") as f:
            for line in lines:
                yield f, line


def remove_paramtable_comment(
    line: str,
) -> str:
    """
    Remove the comment markers from the line

    Args:
        line: The line to remove the comment markers from

    Returns:
        str: The line with the comment markers removed
    """
    if line.startswith("<!-- <ParamTable param={{") and line.endswith("}} /> -->\n"):
        # remove the comment markers
        # these are added in deephaven_autodoc.py to prevent special characters from being escaped
        # by the markdown renderer
        line = line.replace("<!-- ", "")
        line = line.replace(" -->", "")
    return line


def build_documents() -> None:
    """
    Make the markdown files and copy the assets in
    """
    os.system("make clean")

    print("Building markdown")
    os.system("make markdown")

    print("Copying assets")
    os.system(f"cp -r docs/_assets {BUILT_DOCS}/_assets")
    try:
        os.system(f"cp docs/sidebar.json {BUILT_DOCS}/sidebar.json")
    except FileNotFoundError:
        # the sidebar may not exist
        pass

    os.system(f"rm {BUILT_DOCS}/index.md")

    remove_markdown_comments()


def remove_markdown_comments() -> None:
    """
    Remove the comment markers from the markdown files
    """
    for f, line in md_lines():
        f.write(remove_paramtable_comment(line))
