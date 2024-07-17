from __future__ import annotations

import click
import os
import sys
from typing import Generator

# get the directory of the current file
current_dir = os.path.dirname(os.path.abspath(__file__))
# navigate out one directory to get to the plugins directory
plugins_dir = os.path.join(current_dir, "../plugins")


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
    plugins: tuple[str],
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


def run_build(
    plugins: tuple[str],
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

            click.echo(f"Building {plugin}")
            run_command(f"python -m build --wheel {plugins_dir}/{plugin}")
        elif error_on_missing:
            click.echo(f"Error: setup.cfg not found in {plugin}")
            sys.exit(1)


def run_install(
    plugins: tuple[str],
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
            click.echo(f"Installing {plugin}")
            run_command(f"{install} {plugins_dir}/{plugin}/dist/*")
    else:
        click.echo("Installing all plugins")
        run_command(f"{install} {plugins_dir}/*/dist/*")


def run_docs(
    plugins: tuple[str],
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
            click.echo(f"Generating docs for {plugin}")
            run_command(f"python {plugins_dir}/{plugin}/make_docs.py")
        elif error_on_missing:
            click.echo(f"Error: make_docs.py not found in {plugin}")
            sys.exit(1)


@click.command(
    short_help="Build and install plugins.",
    help="Build and install plugins. "
    "By default, all plugins with the necessary file are used unless specified via the plugins arg.",
)
@click.option(
    "--build", "-b", is_flag=True, help="Build all plugins that have a setup.cfg"
)
@click.option(
    "--install",
    "-i",
    is_flag=True,
    help="Install all plugins that have a setup.cfg. This is the default behavior if no flags are provided.",
)
@click.option(
    "--reinstall",
    "-r",
    is_flag=True,
    help="Reinstall all plugins that have a setup.cfg. "
    "This adds the --force-reinstall and --no-deps flags to pip install. "
    "Useful to reinstall a plugin that has already been installed and does not have a new version number.",
)
@click.option(
    "--docs",
    "-d",
    is_flag=True,
    help="Generate docs for all plugins that have a make_docs.py.",
)
@click.option(
    "--server",
    "-s",
    is_flag=True,
    help="Run the deephaven server after building and installing the plugins.",
)
@click.argument("plugins", nargs=-1)
def builder(
    build: bool,
    install: bool,
    reinstall: bool,
    docs: bool,
    server: bool,
    plugins: tuple[str],
) -> None:
    """
    Build and install plugins.

    Args:
        build: True to build the plugins
        install: True to install the plugins
        reinstall: True to reinstall the plugins
        docs: True to generate the docs
        server: True to run the deephaven server after building and installing the plugins
        plugins: Plugins to build and install
    """

    # default is to install
    if not any([build, install, reinstall, docs]):
        install = True

    if build or install or reinstall:
        run_build(plugins, len(plugins) > 0)

    if install or reinstall:
        run_install(plugins, reinstall)

    if docs:
        run_docs(plugins, len(plugins) > 0)

    if server:
        click.echo("Running deephaven server")
        os.system("deephaven server")


if __name__ == "__main__":
    builder()
