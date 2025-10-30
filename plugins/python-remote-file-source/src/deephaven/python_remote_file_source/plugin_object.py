from __future__ import annotations
import sys
from typing import Optional


class PluginObject:
    _execution_context_connection_id: Optional[str] = None
    _top_level_module_fullnames: set[str] = set()

    """
    Plugin object that holds state for the plugin.

    Attributes:
    """

    def __init__(self):
        pass

    def evict_module_cache(self) -> None:
        """
        Evict any cached modules that were loaded from the `RemoteModuleLoader`.
        """
        for mod_name in list(sys.modules.keys()):
            if self.is_sourced_by_plugin(mod_name):
                del sys.modules[mod_name]

    def get_top_level_module_fullnames(self) -> set[str]:
        """
        Get the set of top level module fullnames that can be sourced by the client.
        """
        return self._top_level_module_fullnames

    def is_sourced_by_plugin(
        self, module_fullname: str, connection_id: Optional[str] = None
    ) -> bool:
        """
        Check if a module fullname is included in the registered top-level module
        names. Optionally check if a given connection id matches the current
        connection id for the current execution context.
        Args:
            module_fullname: The full name of the module to check.
            connection_id: The connection id to check.
        Returns:
            bool: True if the check passes, False otherwise.
        """
        if (
            connection_id is not None
            and connection_id != self._execution_context_connection_id
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
        Args:
            connection_id: The connection id for the execution context.
            top_level_module_fullnames: The set of top level module fullnames.
        Returns:
            None
        """
        self.evict_module_cache()
        self._execution_context_connection_id = connection_id
        self._top_level_module_fullnames = top_level_module_fullnames
