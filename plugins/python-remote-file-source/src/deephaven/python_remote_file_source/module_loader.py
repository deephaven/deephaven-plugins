from importlib.abc import MetaPathFinder, Loader
from importlib.machinery import ModuleSpec
import logging
from types import ModuleType
from typing import Optional, Sequence

from .plugin_object import PluginObject
from .json_rpc import create_request_msg
from .types import MessageStreamRequestInterface, RemotePythonModuleSpecData


logger = logging.getLogger(__name__)


class RemoteModuleLoader(Loader):
    """
    A custom module loader that loads modules from a remote source.
    """

    _source: str | None

    def __init__(self, source: Optional[str]):
        self._source = source

    def create_module(self, spec: ModuleSpec):
        return None

    def exec_module(self, module: ModuleType):
        """
        Execute the module source in the given module.
        Args:
            module: The module to execute the code in.
        Returns: None
        """
        if self._source is None:
            return

        spec = module.__spec__
        if spec is None:
            return

        exec(compile(self._source, spec.origin or "<string>", "exec"), module.__dict__)


class RemoteMetaPathFinder(MetaPathFinder):
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
        """
        Find the module spec for a given module fullname.
        Args:
            fullname: The full name of the module to find.
            path: (not used).
            target: (not used).
        Returns: The module spec if found, None otherwise.
        """
        if not self._connection or not self._plugin.is_sourced_by_plugin(
            fullname, self._connection.id
        ):
            # return None so that other finder/loaders can try
            return None

        module_spec_data: RemotePythonModuleSpecData | None = None

        try:
            msg = create_request_msg("fetch_module", {"module_name": fullname})
            response = self._connection.request_data_sync(msg)
        except Exception as err:
            logger.error(
                f"Error finding external module spec: {fullname}", exc_info=True
            )
            raise

        module_spec_data: RemotePythonModuleSpecData | None = response.get("result")
        if module_spec_data is None:
            logger.error(f"Module spec not found: {fullname}", response.get("error"))
            return

        logger.info(
            "Fetched module spec: %s source=%s",
            fullname,
            "True" if module_spec_data.get("source") else "None",
        )

        module_spec = ModuleSpec(
            name=module_spec_data.get("name"),
            origin=module_spec_data.get("origin"),
            is_package=module_spec_data.get("is_package"),
            loader=RemoteModuleLoader(module_spec_data.get("source")),
        )

        module_spec.submodule_search_locations = module_spec_data.get(
            "submodule_search_locations"
        )

        return module_spec
