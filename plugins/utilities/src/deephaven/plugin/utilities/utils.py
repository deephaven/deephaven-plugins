import abc
import logging
import shutil
import os
import subprocess
from functools import partial
from typing import Callable, ContextManager
import importlib.resources
import json
import pathlib
import sys
from deephaven.plugin import Callback
from deephaven.plugin.js import JsPlugin

logger = logging.getLogger(__name__)


def package_js(js_dir: str, dest_dir: str) -> None:
    """
    Package the built JS files at the given JS directory and unpack them into the destination directory.

    Args:
        js_dir:
            The directory containing the JS files
        dest_dir:
            The directory to unpack the JS files into
    """
    dist_dir = os.path.join(js_dir, "dist")
    build_dir = os.path.join(js_dir, "build")
    package_dir = os.path.join(build_dir, "package")

    # copy the bundle to the directory
    # the path may not exist (e.g. when running tests)
    # so it is not strictly necessary to copy the bundle
    if os.path.exists(dist_dir):
        # ignore errors as the directory may not exist
        shutil.rmtree(build_dir, ignore_errors=True)
        shutil.rmtree(dest_dir, ignore_errors=True)

        os.makedirs(build_dir, exist_ok=True)

        # pack and unpack into the js directory
        subprocess.run(
            ["npm", "pack", "--pack-destination", "build"], cwd=js_dir, check=True
        )
        # it is assumed that there is only one tarball in the directory
        files = os.listdir(build_dir)
        for file in files:
            subprocess.run(["tar", "-xzf", file], cwd=build_dir, check=True)
            os.remove(os.path.join(build_dir, file))

        # move the package directory to the expected package location
        shutil.move(package_dir, dest_dir)


def attempt_registration(callback: Callback, js_plugin: JsPlugin) -> None:
    """
    Attempt to register a JS plugin.
    If failed, and enterprise is not detected, it will log as a warning and continue.

    Args:
        callback:
            A callback to register the JS plugin
        js_plugin:
            The JS plugin to register
    """
    try:
        callback.register(js_plugin)
    except RuntimeError:
        # warning should only be logged if enterprise is not detected
        if not os.path.exists("/usr/illumon/latest/bin"):
            logger.warning(
                f"Failed to register {js_plugin} embedded in python plugin. Skipping."
            )


def _create_from_npm_package_json(
    path_provider: Callable[[], ContextManager[pathlib.Path]], plugin_class: abc.ABCMeta
) -> JsPlugin:
    """
    Create a JsPlugin from an npm package.json file.

    Args:
        path_provider:
            A function that returns a context manager that provides a pathlib.Path to the package.json file
        plugin_class:
            The class to create. It must be a subclass of JsPlugin.
    """
    with path_provider() as tmp_js_path:
        js_path = tmp_js_path
    if not js_path.exists():
        raise Exception(
            f"Package is not installed in a normal python filesystem, '{js_path}' does not exist"
        )
    with (js_path / "package.json").open("rb") as f:
        package_json = json.load(f)
    return plugin_class(
        package_json["name"],
        package_json["version"],
        package_json["main"],
        js_path,
    )


def _resource_js_path_provider(
    package_namespace: str, js_name: str
) -> Callable[[], ContextManager[pathlib.Path]]:
    """
    Get the path to a resource in a package.

    Args:
        package_namespace:
            The package namespace
        js_name:
            The resource name
    """
    return partial(_resource_js_path, package_namespace, js_name)


def _resource_js_path(
    package_namespace: str, js_name: str
) -> ContextManager[pathlib.Path]:
    """
    Get the path to a resource in a package.

    Args:
        package_namespace:
            The package namespace
        js_name:
            The resource name
    """

    if sys.version_info < (3, 9):
        return importlib.resources.path(package_namespace, js_name)
    else:
        return importlib.resources.as_file(
            importlib.resources.files(package_namespace).joinpath(js_name)
        )


def create_js_plugin(
    package_namespace: str, js_name: str, plugin_class: abc.ABCMeta
) -> JsPlugin:
    """
    Create a JsPlugin from an npm package.json file.

    Args:
        package_namespace:
            The package namespace
        js_name:
            The resource name
        plugin_class:
            The class to create. It must be a subclass of JsPlugin.

    Returns:
        The created JsPlugin
    """
    js_path = _resource_js_path_provider(package_namespace, js_name)
    return _create_from_npm_package_json(js_path, plugin_class)
