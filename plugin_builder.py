from __future__ import annotations

import argparse
import os
import sys
from typing import Generator

# get the directory of the current file
current_dir = os.path.dirname(os.path.abspath(__file__))
# use the current_dir to get to the plugins directory
plugins_dir = os.path.join(current_dir, "plugins")


def clean_build_dist(plugin: str) -> None:
    """
    Remove the build and dist directories for a plugin.

    Args:
        plugin: The plugin to clean.

    Returns:
        None
    """
    if os.path.exists(f"{plugins_dir}/{plugin}/build"):
        os.system(f"rm -rf {plugins_dir}/{plugin}/build")
    if os.path.exists(f"{plugins_dir}/{plugin}/dist"):
        os.system(f"rm -rf {plugins_dir}/{plugin}/dist")


def plugin_names(
    plugins: list[str],
) -> Generator[str, None, None]:
    """
    Generate the plugins to use

    Args:
        plugins: The plugins to generate. If None, all plugins are yielded

    Returns:
        A generator of plugins
    """
    if plugins:
        for plugin in plugins:
            yield plugin
    else:
        for plugin in os.listdir(plugins_dir):
            yield plugin


def run_command(command: str) -> None:
    """
    Run a command and exit if it fails.

    Args:
        command: The command to run.

    Returns:
        None
    """
    code = os.system(command)
    if code != 0:
        sys.exit(code)


def build(
    plugins: list[str],
    error_on_missing: bool,
) -> None:
    """
    Build plugins that have a setup.cfg.

    Args:
        plugins: The plugins to build. If None, all plugins with a setup.cfg are built.
        error_on_missing: Whether to error if a plugin does not have a setup.cfg

    Returns:
        None
    """

    for plugin in plugin_names(plugins):
        if os.path.exists(f"{plugins_dir}/{plugin}/setup.cfg"):
            clean_build_dist(plugin)

            print(f"Building {plugin}")
            run_command(f"python -m build --wheel {plugins_dir}/{plugin}")
        elif error_on_missing:
            print(f"Error: setup.cfg not found in {plugin}")
            sys.exit(1)


def install(
    plugins: list[str],
    reinstall: bool,
) -> None:
    """
    Install plugins that have been built

    Args:
        plugins: The plugins to install. If None, all plugins with a setup.cfg are installed.
        reinstall: Whether to reinstall the plugins.
            If True, the --force-reinstall and --no-deps flags are added to pip install.

    Returns:
        None
    """
    install = "pip install"
    if reinstall:
        install += " --force-reinstall --no-deps"

    if plugins:
        for plugin in plugins:
            # a plugin would have failed in the build step if it didn't have a setup.cfg
            print(f"Installing {plugin}")
            run_command(f"{install} {plugins_dir}/{plugin}/dist/*")
    else:
        print("Installing all plugins")
        run_command(f"{install} {plugins_dir}/*/dist/*")


def docs(
    plugins: list[str],
    error_on_missing: bool,
) -> None:
    """
    Generate docs for plugins that have a make_docs.py

    Args:
        plugins: The plugins to generate docs for. If None, all plugins with a make_docs.py are built.
        error_on_missing: Whether to error if a plugin does not have a make_docs.py

    Returns:
        None
    """
    for plugin in plugin_names(plugins):
        if os.path.exists(f"{plugins_dir}/{plugin}/make_docs.py"):
            print(f"Generating docs for {plugin}")
            run_command(f"python {plugins_dir}/{plugin}/make_docs.py")
        elif error_on_missing:
            print(f"Error: make_docs.py not found in {plugin}")
            sys.exit(1)


parser = argparse.ArgumentParser(description="Build and install plugins")
parser.add_argument(
    "-b", "--build", action="store_true", help="Build all plugins that have a setup.cfg"
)
parser.add_argument(
    "-i",
    "--install",
    action="store_true",
    help="Install all plugins that have a setup.cfg. This is the default behavior if no flags are provided.",
)
parser.add_argument(
    "-r",
    "--reinstall",
    action="store_true",
    help="Reinstall all plugins that have a setup.cfg. "
    "This adds the --force-reinstall and --no-deps flags to pip install. "
    "Useful to reinstall a plugin that has already been installed and does not have a new version number.",
)
parser.add_argument(
    "-d",
    "--docs",
    action="store_true",
    help="Generate docs for all plugins that have a make_docs.py.",
)
parser.add_argument(
    "-s",
    "--server",
    action="store_true",
    help="Run the deephaven server after building and installing the plugins.",
)
parser.add_argument(
    "plugins",
    nargs="*",
    default=[],
    help="Plugins to build, install, or generate docs for. By default, all plugins with the necessary file are used.",
)


args = parser.parse_args()

# default is to install
if not any([args.build, args.install, args.reinstall, args.docs]):
    args.install = True

plugins = args.plugins

if args.build or args.install or args.reinstall:
    build(plugins, len(plugins) > 0)

if args.install or args.reinstall:
    install(plugins, args.reinstall)

if args.docs:
    docs(plugins, len(plugins) > 0)

if args.server:
    print("Running deephaven server")
    os.system("deephaven server")
