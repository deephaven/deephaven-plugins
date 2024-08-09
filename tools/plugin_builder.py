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
        run_command(f"rm -rf {plugins_dir}/{plugin}/build")
    if os.path.exists(f"{plugins_dir}/{plugin}/dist"):
        run_command(f"rm -rf {plugins_dir}/{plugin}/dist")


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


def run_build_js(plugins: tuple[str]) -> None:
    """
    Build the JS files for plugins that have a js directory

    Args:
        plugins: The plugins to build. If None, all plugins with a js directory are built.

    Returns:
        None
    """
    if plugins:
        for plugin in plugins:
            if os.path.exists(f"{plugins_dir}/{plugin}/src/js"):
                click.echo(f"Building JS for {plugin}")
                run_command(f"npm run build --prefix {plugins_dir}/{plugin}/src/js")
            else:
                click.echo(f"Error: src/js not found in {plugin}")
    else:
        click.echo(f"Building all JS plugins")
        run_command(f"npm run build")


def run_configure(
    configure: str | None,
) -> None:
    """
    Configure the venv for plugin development

    Args:
        configure: The configuration to use. 'min' will install the minimum requirements for development.
            'full' will install some optional packages for development, such as sphinx and deephaven-server.

    Returns:
        None
    """
    if configure in ["min", "full"]:
        run_command("pip install -r requirements.txt")
        run_command("pre-commit install")
        run_command("npm install")
    if configure == "full":
        # currently deephaven-server is installed as part of the sphinx_ext requirements
        run_command("pip install -r sphinx_ext/sphinx-requirements.txt")


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
@click.option(
    "--js",
    "-j",
    is_flag=True,
    help="Build the JS files for the plugins.",
)
@click.option(
    "--configure",
    "-c",
    default=None,
    help="Configure your venv for plugin development. 'min' will install the minimum requirements for development."
    "'full' will install some optional packages for development, such as sphinx and deephaven-server.",
)
@click.argument("plugins", nargs=-1)
def builder(
    build: bool,
    install: bool,
    reinstall: bool,
    docs: bool,
    server: bool,
    js: bool,
    configure: str | None,
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
        js: True to build the JS files for the plugins
        configure: The configuration to use. 'min' will install the minimum requirements for development.
            'full' will install some optional packages for development, such as sphinx and deephaven-server.
        plugins: Plugins to build and install
    """
    run_configure(configure)

    # default is to install, but don't if just configuring
    if not any([build, install, reinstall, docs, js, configure]):
        js = True
        install = True

    if js:
        run_build_js(plugins)

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
