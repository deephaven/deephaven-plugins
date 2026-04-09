from __future__ import annotations
import logging
import sys
from typing import Optional

logger = logging.getLogger(__name__)


class PluginObject:
    _execution_context_connection_id: Optional[str] = None
    _top_level_module_fullnames: set[str] = set()

    """
    Plugin object that holds state for the plugin.

    Attributes:
    """

    def __init__(self):
        pass

    def _is_module_in_top_level_names(
        self, module_fullname: str, top_level_module_fullnames: set[str]
    ) -> bool:
        """
        Check if a module fullname matches any of the top-level module names.
        Args:
            module_fullname: The full name of the module to check.
            top_level_module_fullnames: The set of top-level module names to check against.
        Returns:
            bool: True if the module matches any top-level name, False otherwise.
        """
        if not top_level_module_fullnames:
            return False

        for top_level_name in top_level_module_fullnames:
            if module_fullname == top_level_name or module_fullname.startswith(
                top_level_name + "."
            ):
                return True

        return False

    def evict_module_cache(self, top_level_module_fullnames: set[str]) -> None:
        """
        Evict any cached modules that match the given top-level module names.
        Args:
            top_level_module_fullnames: The set of top-level module names to evict.
        """
        evicted = []
        for mod_name in list(sys.modules.keys()):
            if self._is_module_in_top_level_names(mod_name, top_level_module_fullnames):
                del sys.modules[mod_name]
                evicted.append(mod_name)

        logger.debug(
            f"Evicted {len(evicted)} modules: {evicted} --------------------------------------------------------------------------------------"
        )

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
            logger.debug(
                "Connection ID is not the active execution context: %s != %s",
                connection_id,
                self._execution_context_connection_id,
            )
            return False

        return self._is_module_in_top_level_names(
            module_fullname, self._top_level_module_fullnames
        )

    def set_execution_context(
        self, connection_id: Optional[str], top_level_module_fullnames: set[str] | dict
    ) -> None:
        """
        Set the execution context for the object. This includes the set of top
        level module fullnames that can be sourced by the client.
        Args:
            connection_id: The connection id for the execution context.
            top_level_module_fullnames: A dict or set of top level module fullnames.
                If a dict is provided, the keys will be used as the set of fullnames
                and the values will be ignored. This gracefully handles the
                mismatch between Python {} and {"value"} producing different
                types in Python in cases where a client is building the arg in
                a string expression.
        Returns:
            None
        """
        logger.debug(
            f"set_execution_context: cn={connection_id}, "
            f"old={self._top_level_module_fullnames}, "
            f"new={top_level_module_fullnames}"
        )

        # Convert dict to set
        if isinstance(top_level_module_fullnames, dict):
            top_level_module_fullnames = set(top_level_module_fullnames.keys())

        # Evict cached modules
        # 1. Any matching the old configuration to ensure remote sources from
        #    previous execution contexts are cleared out.
        # 2. Any matching the new configuration to ensure that if there are any
        #    server sourced modules that have already been loaded, they will get
        #    evicted so that the new remote source can be loaded.
        combined_names = self._top_level_module_fullnames | top_level_module_fullnames
        self.evict_module_cache(combined_names)

        self._execution_context_connection_id = connection_id
        self._top_level_module_fullnames = top_level_module_fullnames
