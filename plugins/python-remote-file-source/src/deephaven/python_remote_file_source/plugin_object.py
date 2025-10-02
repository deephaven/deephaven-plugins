from __future__ import annotations
import sys
from typing import Optional


class PluginObject:
    execution_context_connection_id: Optional[str] = None
    _top_level_module_fullnames: set[str] = set()

    """
    Plugin object that holds state for the plugin.

    Attributes:
        execution_context_connection_id: Optional[str]: The connection id of the current execution context
        _top_level_module_fullnames: set[str]: The set of top level module fullnames that can be sourced by the client
    """

    def __init__(self):
        pass

    def evict_module_cache(self) -> None:
        """
        Evict any cached modules that were loaded from the `RemoteModuleLoader`.
        """
        for mod_name in list(sys.modules.keys()):
            if self.is_sourced_by_execution_context(
                mod_name, self.execution_context_connection_id
            ):
                del sys.modules[mod_name]

    def get_top_level_module_fullnames(self) -> set[str]:
        """
        Get the set of top level module fullnames that can be sourced by the client.
        """
        return self._top_level_module_fullnames

    def is_sourced_by_execution_context(
        self, module_fullname: str, connection_id: Optional[str]
    ) -> bool:
        """
        Check if a module fullname is included in the registered top-level module
        names and that the given connection id matches the current execution context.
        """
        if (
            connection_id is None
            or connection_id != self.execution_context_connection_id
        ):
            return False

        if self._top_level_module_fullnames is None:
            return False

        for top_level_name in self._top_level_module_fullnames:
            if module_fullname == top_level_name or module_fullname.startswith(
                top_level_name + "."
            ):
                return True

        return False

    def set_execution_context(
        self, connection_id: Optional[str], top_level_module_fullnames: set[str]
    ) -> None:
        """
        Set the execution context for the object. This includes the set of top
        level module fullnames that can be sourced by the client.
        """
        self.evict_module_cache()
        self.execution_context_connection_id = connection_id
        self._top_level_module_fullnames = top_level_module_fullnames
