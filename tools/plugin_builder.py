from __future__ import annotations

import click
import os
import sys
from typing import Generator, Callable
import time
import subprocess
from watchdog.events import FileSystemEvent, RegexMatchingEventHandler
from watchdog.observers import Observer
import threading

# get the directory of the current file
current_dir = os.path.dirname(os.path.abspath(__file__))
# navigate out one directory to get to the plugins directory
plugins_dir = os.path.join(current_dir, "../plugins")
# navigate up one directory to get to the project directory
project_path = os.path.split(current_dir)[0]

# these are the patterns to watch for changes in the plugins directory
# if in editable mode, the builder will rerun when these files change
REBUILD_REGEXES = [
    r".*\.py$",
    r".*\.js$",
    r".*\.md$",
    r".*\.svg$",
    r".*\.ts$",
    r".*\.tsx$",
    r".*\.scss$",
]

# ignore these patterns in particular
# prevents infinite loops when the builder is rerun
IGNORE_REGEXES = [
    r".*/dist/.*",
    r".*/build/.*",
    r".*/node_modules/.*",
    r".*/_js/.*",
    r".*/test_ws/.*$",
    # ignore hidden files and directories
    r".*/\..*/.*",
    # ignore the test node client since it is not part of plugin code, and we
    # don't want changes to restart the builder / server
    r".*/plugins/python-remote-file-source/test-node-client/.*",
]


class PluginsChangedHandler(RegexMatchingEventHandler):
    """
    A handler that watches for changes reruns the function when changes are detected

    Args:
        func: The function to run when changes are detected
        stop_event: The event to signal the function to stop

    Attributes:
        func: The function to run when changes are detected
        stop_event: The event to signal the function to stop
        rerun_lock: A lock to prevent multiple reruns from occurring at the same time
    """

    def __init__(self, func: Callable, stop_event: threading.Event) -> None:
        super().__init__(regexes=REBUILD_REGEXES, ignore_regexes=IGNORE_REGEXES)

        self.func = func

        # A flag to indicate whether the function should continue running
        # Also prevents unnecessary reruns
        self.stop_event = stop_event

        # A lock to prevent multiple reruns from occurring at the same time
        self.rerun_lock = threading.Lock()

        # always have an initial run
        threading.Thread(target=self.attempt_rerun).start()

    def attempt_rerun(self) -> None:
        """
        Attempt to rerun the function.
        If the stop event is set, do not rerun because a rerun has already been scheduled.
        """
        self.stop_event.set()
        with self.rerun_lock:
            self.stop_event.clear()
            self.func()

    def event_handler(self, event: FileSystemEvent) -> None:
        """
        Handle any file system event

        Args:
            event: The event that occurred
        """
        if self.stop_event.is_set():
            # a rerun has already been scheduled on another thread
            print(
                f"File {event.src_path} {event.event_type}, rerun has already been scheduled"
            )
            return
        print(f"File {event.src_path} {event.event_type}, new rerun scheduled")
        threading.Thread(target=self.attempt_rerun).start()

    def on_created(self, event: FileSystemEvent) -> None:
        """
        Handle a file creation event

        Args:
            event: The event that occurred
        """
        self.event_handler(event)

    def on_deleted(self, event: FileSystemEvent) -> None:
        """
        Handle a file deletion event

        Args:
            event: The event that occurred
        """
        self.event_handler(event)

    def on_modified(self, event: FileSystemEvent) -> None:
        """
        Handle a file modification event

        Args:
            event: The event that occurred
        """
        self.event_handler(event)

    def on_moved(self, event: FileSystemEvent) -> None:
        """
        Handle a file move event

        Args:
            event: The event that occurred

        Returns:

        """
        self.event_handler(event)


def clean_build_dist(plugin: str) -> None:
    """
    Remove the build and dist directories for a plugin.

    Args:
        plugin: The plugin to clean.

    Returns:
        None
    """
    # these folders may not exist, so ignore the errors
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
    This should only be used in a non-main thread.

    Args:
        command: The command to run.

    Returns:
        None
    """
    code = os.system(command)
    if code != 0:
        os._exit(1)


def run_main_command(command: str) -> None:
    """
    Run a command and exit if it fails.
    This should only be used in the main thread.

    Args:
        command: The command to run.

    Returns:
        None
    """
    code = os.system(command)
    if code != 0:
        sys.exit(1)


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
            os._exit(1)


def install_with_all_extras(
    install: str,
    wheels: str,
) -> None:
    """
    Install all extras for the plugins

    Args:
        install: The command to use to install the plugins
        wheels: The wheels to install
    """
    run_command(f'find {wheels} | xargs -I {{}} {install} "{{}}[all]"')


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
            install_with_all_extras(install, f"{plugins_dir}/{plugin}/dist/*")
    else:
        click.echo("Installing all plugins")
        install_with_all_extras(install, f"{plugins_dir}/*/dist/*")


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
            os._exit(1)


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
        run_main_command("pip install -r requirements.txt")
        run_main_command("pre-commit install")
        run_main_command("npm install")
    if configure == "full":
        # currently deephaven-server is installed as part of the sphinx_ext requirements
        run_main_command("pip install -r sphinx_ext/sphinx-requirements.txt")


def build_server_args(server_arg: tuple[str]) -> list[str]:
    """
    Build the server arguments to pass to the deephaven server
    By default, the --no-browser flag is added to the server arguments unless the --browser flag is present

    Args:
        server_arg: The arguments to pass to the server
    """
    server_args = ["--no-browser"]
    if server_arg:
        if "--no-browser" in server_arg or "--browser" in server_arg:
            server_args = list(server_arg)
        else:
            server_args = server_args + list(server_arg)
    return server_args


def handle_args(
    build: bool,
    install: bool,
    reinstall: bool,
    docs: bool,
    snapshots: bool,
    server: bool,
    server_arg: tuple[str],
    js: bool,
    configure: str | None,
    plugins: tuple[str],
    stop_event: threading.Event,
) -> None:
    """
    Handle all arguments for the builder command

    Args:
        build: True to build the plugins
        install: True to install the plugins
        reinstall: True to reinstall the plugins
        docs: True to generate the docs
        server: True to run the deephaven server after building and installing the plugins
        server_arg: The arguments to pass to the server
        js: True to build the JS files for the plugins
        configure: The configuration to use. 'min' will install the minimum requirements for development.
            'full' will install some optional packages for development, such as sphinx and deephaven-server.
        plugins: Plugins to build and install
        stop_event: The event to signal the function to stop
    """
    # it is possible that the stop event is set before this function is called
    if stop_event.is_set():
        return

    # default is to install, but don't if just configuring
    if not any([build, install, reinstall, docs, js, configure]):
        js = True
        install = True

    # if this thread is signaled to stop, return after the current command
    # instead of in the middle of a command, which could leave the environment in a bad state
    if stop_event.is_set():
        return

    if js:
        run_build_js(plugins)

    if stop_event.is_set():
        return

    if build or install or reinstall:
        run_build(plugins, len(plugins) > 0)

    if stop_event.is_set():
        return

    if install or reinstall:
        run_install(plugins, reinstall)

    if stop_event.is_set():
        return

    if snapshots:
        run_command("npm run update-doc-snapshots")

    if docs:
        run_docs(plugins, len(plugins) > 0)

    if stop_event.is_set():
        return

    if server or server_arg:
        server_args = build_server_args(server_arg)

        click.echo(f"Running deephaven server with args: {server_args}")
        process = subprocess.Popen(["deephaven", "server"] + server_args)

        # waiting on either the process to finish or the stop event to be set
        while not stop_event.wait(1):
            poll = process.poll()
            if poll is not None:
                # process threw an error or was killed, so exit
                os._exit(process.returncode)

        # stop event is set, so kill the process
        process.terminate()
        try:
            process.wait(timeout=1)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


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
    help="Generate docs for all plugins that have a make_docs.py. "
    "There must be an installed version of the plugin to generate the docs."
    "Consider using the --reinstall or --install flags to update the plugin before generating the docs.",
)
@click.option(
    "--snapshots",
    is_flag=True,
    help="Generate snapshots for all plugins that have a make_docs.py. "
    "The docs should be updated before generating snapshots."
    "Consider using the --docs flags to build the docs before updating the snapshots.",
)
@click.option(
    "--server",
    "-s",
    is_flag=True,
    help="Run the deephaven server after building and installing the plugins.",
)
@click.option(
    "--server-arg",
    "-sa",
    default=tuple(),
    multiple=True,
    help="Run the deephaven server after building and installing the plugins with the provided argument.",
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
    help="Configure your venv for plugin development. 'min' will install the minimum requirements for development. "
    "'full' will install some optional packages for development, such as sphinx and deephaven-server.",
)
@click.option(
    "--watch",
    "-w",
    is_flag=True,
    help="Run the other provided commands in an editable-like mode, watching for changes "
    "This will rerun all other commands (except configure) when files are changed. "
    "The top level directory of this project is watched.",
)
@click.argument("plugins", nargs=-1)
def builder(
    build: bool,
    install: bool,
    reinstall: bool,
    docs: bool,
    snapshots: bool,
    server: bool,
    server_arg: tuple[str],
    js: bool,
    configure: str | None,
    watch: bool,
    plugins: tuple[str],
) -> None:
    """
    Build and install plugins.

    Args:
        build: True to build the plugins
        install: True to install the plugins
        reinstall: True to reinstall the plugins
        docs: True to generate the docs
        snapshots: True to generate the snapshots
        server: True to run the deephaven server after building and installing the plugins
        server_arg: The arguments to pass to the server
        js: True to build the JS files for the plugins
        configure: The configuration to use. 'min' will install the minimum requirements for development.
            'full' will install some optional packages for development, such as sphinx and deephaven-server.
        watch: True to rerun the other commands when files are changed
        plugins: Plugins to build and install
    """
    # no matter what, only run the configure command once
    run_configure(configure)

    stop_event = threading.Event()

    def run_handle_args() -> None:
        """
        Run the handle_args function with the provided arguments
        """
        handle_args(
            build,
            install,
            reinstall,
            docs,
            snapshots,
            server,
            server_arg,
            js,
            configure,
            plugins,
            stop_event,
        )

    if not watch:
        # since editable is not specified, only run the handler once
        # call it from a thread to allow the usage of os._exit to exit the process
        # rather than sys.exit because sys.exit will not exit the process when called from a thread
        # and os._exit should be called from a thread
        thread = threading.Thread(target=run_handle_args)
        thread.start()
        thread.join()
        return

    # editable is specified, so run the handler in a loop that watches for changes and
    # reruns the handler when changes are detected
    event_handler = PluginsChangedHandler(run_handle_args, stop_event)
    observer = Observer()
    observer.schedule(event_handler, project_path, recursive=True)
    observer.start()
    try:
        while True:
            input()
    finally:
        observer.stop()
        observer.join()


if __name__ == "__main__":
    builder()
