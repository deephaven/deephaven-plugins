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
# this is used to watch for changes in this directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# these are the patterns to watch for changes in this directory
# if in editable mode, the builder will rerun when these files change
REBUILD_REGEXES = [
    r".*\.py$",
    r".*\.js$",
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
    r".*/src/node/.*",
    r".*/test_ws/.*$",
    # ignore hidden files and directories
    r".*/\..*/.*",
]

# the path where the python files are located relative to this script
# modify this if the python files are moved
PYTHON_DIR = "."
# the path where the JS files are located relative to this script
# modify this if the JS files are moved
JS_DIR = "./src/js"


class PluginsChangedHandler(RegexMatchingEventHandler):
    """
    A handler that watches for changes and reruns the function when changes are detected

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


def clean_build_dist() -> None:
    """
    Remove the build and dist directories.
    """
    # these folders may not exist, so ignore the errors
    if os.path.exists(f"{PYTHON_DIR}/build"):
        os.system(f"rm -rf {PYTHON_DIR}/build")
    if os.path.exists(f"{PYTHON_DIR}/dist"):
        os.system(f"rm -rf {PYTHON_DIR}/dist")


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


def run_build() -> None:
    """
    Build the plugin
    """

    clean_build_dist()

    click.echo(f"Building plugin")
    run_command(f"python -m build --wheel {PYTHON_DIR}")


def run_install(
    reinstall: bool,
) -> None:
    """
    Install plugins that have been built

    Args:
        reinstall: Whether to reinstall the plugins.
            If True, the --force-reinstall and --no-deps flags are added to pip install.

    Returns:
        None
    """
    install = "pip install"
    if reinstall:
        install += " --force-reinstall --no-deps"

    click.echo("Installing plugin")
    run_command(f"{install} {PYTHON_DIR}/dist/*.whl")


def run_build_js() -> None:
    """
    Build the JS files for the plugin
    """
    click.echo(f"Building the JS plugin")
    run_command(f"npm run build --prefix {JS_DIR}")


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
    server: bool,
    server_arg: tuple[str],
    js: bool,
    stop_event: threading.Event,
) -> None:
    """
    Handle all arguments for the builder command

    Args:
        build: True to build the plugins
        install: True to install the plugins
        reinstall: True to reinstall the plugins
        server: True to run the deephaven server after building and installing the plugins
        server_arg: The arguments to pass to the server
        js: True to build the JS files for the plugins
        stop_event: The event to signal the function to stop
    """
    # it is possible that the stop event is set before this function is called
    if stop_event.is_set():
        return

    # default is to install, but don't if just configuring
    if not any([build, install, reinstall, js]):
        js = True
        install = True

    # if this thread is signaled to stop, return after the current command
    # instead of in the middle of a command, which could leave the environment in a bad state
    if stop_event.is_set():
        return

    if js:
        run_build_js()

    if stop_event.is_set():
        return

    if build or install or reinstall:
        run_build()

    if stop_event.is_set():
        return

    if install or reinstall:
        run_install(reinstall)

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
    short_help="Build and install plugin.",
    help="Build and install plugins. "
    "By default, all plugins with the necessary file are used unless specified via the plugins arg.",
)
@click.option("--build", "-b", is_flag=True, help="Build the plugin.")
@click.option(
    "--install",
    "-i",
    is_flag=True,
    help="Install the plugin. This is the default behavior if no flags are provided.",
)
@click.option(
    "--reinstall",
    "-r",
    is_flag=True,
    help="Reinstall the plugin. "
    "This adds the --force-reinstall and --no-deps flags to pip install. "
    "Useful if the plugin has already been installed and does not have a new version number.",
)
@click.option(
    "--server",
    "-s",
    is_flag=True,
    help="Run the deephaven server after building and installing the plugin.",
)
@click.option(
    "--server-arg",
    "-sa",
    default=tuple(),
    multiple=True,
    help="Run the deephaven server after building and installing the plugin with the provided argument.",
)
@click.option(
    "--js",
    "-j",
    is_flag=True,
    help="Build the JS files for the plugin.",
)
@click.option(
    "--watch",
    "-w",
    is_flag=True,
    help="Run the other provided commands in an editable-like mode, watching for changes "
    "This will rerun all other commands (except configure) when files are changed. "
    "The top level directory of this project is watched.",
)
def builder(
    build: bool,
    install: bool,
    reinstall: bool,
    server: bool,
    server_arg: tuple[str],
    js: bool,
    watch: bool,
) -> None:
    """
    Build and install plugins.

    Args:
        build: True to build the plugin
        install: True to install the plugin
        reinstall: True to reinstall the plugin
        server: True to run the deephaven server after building and installing the plugin
        server_arg: The arguments to pass to the server
        js: True to build the JS files for the plugin
        watch: True to rerun the other commands when files are changed
    """
    stop_event = threading.Event()

    def run_handle_args() -> None:
        """
        Run the handle_args function with the provided arguments
        """
        handle_args(
            build,
            install,
            reinstall,
            server,
            server_arg,
            js,
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
    observer.schedule(event_handler, current_dir, recursive=True)
    observer.start()
    try:
        while True:
            input()
    finally:
        observer.stop()
        observer.join()


if __name__ == "__main__":
    builder()
