from importlib.machinery import ModuleSpec
from types import ModuleType
from typing import Optional, Sequence

from .plugin_object import PluginObject
from .json_rpc import create_request_msg
from .logger import Logger
from .types import LocalModuleDescriptor, MessageStreamRequestInterface


logger = Logger("RemoteMetaPathFinder")


class RemoteModuleLoader:
    """
    A custom module loader that loads modules from a remote source.
    """

    _module_descriptor: LocalModuleDescriptor | None

    def __init__(self, module_descriptor: LocalModuleDescriptor | None):
        self._module_descriptor = module_descriptor

    def create_module(self, spec: ModuleSpec):
        return None

    def exec_module(self, module: ModuleType):
        if self._module_descriptor is None:
            return

        source = self._module_descriptor.get("source")
        if source is None:
            return

        filepath = self._module_descriptor.get("filepath")

        exec(compile(source, filepath, "exec"), module.__dict__)


class RemoteMetaPathFinder:
    """
    A custom meta path finder that finds modules that can be sourced remotely.
    """

    _connection: MessageStreamRequestInterface | None = None
    _plugin: PluginObject

    def __init__(self, connection: MessageStreamRequestInterface, plugin: PluginObject):
        self._connection = connection
        self._plugin = plugin

    def find_spec(
        self,
        fullname: str,
        path: Optional[Sequence[str]],
        target: Optional[ModuleType] = None,
    ):
        if not self._connection or not self._plugin.is_sourced_by_execution_context(
            fullname, self._connection.id
        ):
            # return None so that other finder/loaders can try
            return None

        module_spec: LocalModuleDescriptor | None = None

        try:
            msg = create_request_msg("fetch_module", {"module_name": fullname})
            response = self._connection.request_data_sync(msg)
        except Exception as err:
            logger.error("Error finding external module spec:", fullname, err)
            raise

        module_spec = response.get("result")
        if module_spec is None:
            logger.info("Module spec not found:", fullname)
            return

        logger.info(
            "Fetched module spec:",
            fullname,
            "source" if module_spec.get("source") else "None",
        )

        origin = module_spec.get("filepath") if module_spec else None

        return ModuleSpec(
            name=fullname,
            loader=RemoteModuleLoader(module_spec),  # type: ignore
            origin=origin,
            is_package=True,
        )
