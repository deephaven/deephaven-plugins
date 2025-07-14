from __future__ import annotations

import sys
import os
import contextlib
from typing import IO, Generator
from deephaven_autodoc import AUTOFUNCTION_COMMENT_PREFIX

BUILT_DOCS = "docs/build/markdown"


def run_command(command: str, exit_on_fail: bool = True) -> int:
    """
    Run a command and exit if it fails.

    Args:
        command: The command to run.
        exit_on_fail: Whether to exit if the command fails. Default is True. If False, the code is returned.

    Returns:
        If exit_on_fail is True, exits with code 1 if the command failed or returns 0 if it succeeded.
        If exit_on_fail is False, returns 0 if the command succeeded or the error code.
    """
    code = os.system(command)
    if code != 0 and exit_on_fail:
        sys.exit(1)
    return code


def attempt_command_sequence(commands: list[str], exit_on_fail: bool = False) -> int:
    """
    Run a list of commands and exit as soon as one fails.

    Args:
        commands: The list of commands to run.
        exit_on_fail: Whether to exit if a command fails. Default is True.
            If False, the code is returned for the failing command and no subsequent commands are run.

    Returns:
        Returns the code if exit_on_fail is true, or 0 if success.
    """
    for command in commands:
        code = run_command(command, exit_on_fail)
        if code != 0:
            print(f"Failed to run command: {command}")
            return code
    return 0


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
    if line.startswith(f"<!-- {AUTOFUNCTION_COMMENT_PREFIX}") and line.endswith(
        "}} /> -->\n"
    ):
        # remove the comment markers
        # these are added in deephaven_autodoc.py to prevent special characters from being escaped
        # by the markdown renderer
        line = line.replace(f"<!-- {AUTOFUNCTION_COMMENT_PREFIX}", "")
        line = line.replace(" -->", "")
        line = line.replace("<br />", "\n")
    return line


def build_documents() -> int:
    """
    Make the markdown files and copy the assets in

    Returns:
        1 if the build failed, 0 if it succeeded
    """
    commands = [
        "make clean",
        "make markdown",
        f"rm {BUILT_DOCS}/index.md",
        f"cp -r docs/_assets {BUILT_DOCS}/_assets",
        f"[ -d docs/snapshots ] && cp -r docs/snapshots {BUILT_DOCS}/snapshots",
        f"cp docs/sidebar.json {BUILT_DOCS}/sidebar.json",
    ]

    code = attempt_command_sequence(commands)
    if code != 0:
        return 1

    remove_markdown_comments()

    return 0


def remove_markdown_comments() -> None:
    """
    Remove the comment markers from the markdown files
    """
    for f, line in md_lines():
        f.write(remove_paramtable_comment(line))
