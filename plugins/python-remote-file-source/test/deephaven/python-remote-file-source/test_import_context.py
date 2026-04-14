"""
Tests for verifying import behavior with set_execution_context.

These tests verify that:
1. When a module is in set_execution_context, remote sources are used
2. When a module is not in set_execution_context, standard Python imports are used
3. Module cache eviction works correctly when switching between remote and local sources
"""

import sys
import unittest
from importlib import import_module
from importlib.abc import Loader, MetaPathFinder
from importlib.machinery import ModuleSpec
from types import ModuleType
from typing import Optional, Sequence

from src.deephaven.python_remote_file_source.plugin_object import PluginObject
from src.deephaven.python_remote_file_source.module_loader import RemoteMetaPathFinder
from src.deephaven.python_remote_file_source.json_rpc import (
    JsonRpcRequest,
    JsonRpcResponse,
)

# Test module name constants
TEST_MODULE = "test_module"
TEST_PACKAGE = "test_package"


class MockLocalLoader(Loader):
    """Loader that provides modules from memory, mimicking file-based loaders"""

    def __init__(self, source: str):
        self._source = source

    def create_module(self, spec: ModuleSpec):
        return None

    def exec_module(self, module: ModuleType):
        origin = (module.__spec__.origin if module.__spec__ else None) or "<string>"
        exec(compile(self._source, origin, "exec"), module.__dict__)


class MockLocalFinder(MetaPathFinder):
    """Low-priority finder that serves 'local' modules from memory"""

    def __init__(self):
        self._modules = {}

    def add_module(self, name: str, is_package: bool = False):
        """Register a local module that can be imported"""
        self._modules[name] = {
            "source": "value = 'local'",
            "is_package": is_package,
        }

    def find_spec(
        self,
        fullname: str,
        path: Optional[Sequence[str]],
        target: Optional[ModuleType] = None,
    ):
        if fullname not in self._modules:
            return None

        module_data = self._modules[fullname]
        return ModuleSpec(
            name=fullname,
            origin=f"<local:{fullname}>",
            is_package=module_data["is_package"],
            loader=MockLocalLoader(module_data["source"]),
        )


class MockConnection:
    """Mock connection for testing"""

    def __init__(self, connection_id: str):
        self.id = connection_id
        self._remote_modules = {}

    def add_remote_module(self, name: str, is_package: bool = False):
        """Register a remote module that can be fetched"""
        self._remote_modules[name] = {
            "name": name,
            "origin": f"<remote:{name}>",
            "is_package": is_package,
            "source": "value = 'remote'",
            "submodule_search_locations": [] if is_package else None,
        }

    def request_data_sync(
        self, request_msg: JsonRpcRequest, timeout: Optional[float] = None
    ) -> JsonRpcResponse:
        """Mock request_data_sync that returns pre-configured module data"""
        module_name = request_msg["params"]["module_name"]  # type: ignore
        if module_name in self._remote_modules:
            return {"result": self._remote_modules[module_name]}  # type: ignore
        return {"error": f"Module {module_name} not found"}  # type: ignore

    async def request_data(self, request_msg: JsonRpcRequest) -> JsonRpcResponse:
        """Stub for protocol compliance - not used in tests"""
        return {}  # type: ignore

    def send_message(self, message: str) -> None:
        """Stub for protocol compliance - not used in tests"""
        pass


class TestImportWithExecutionContext(unittest.TestCase):
    """Test import behavior with set_execution_context"""

    def setUp(self):
        """Set up test fixtures"""
        self.plugin = PluginObject()
        self.connection_id = "test-connection-1"
        self.mock_connection = MockConnection(self.connection_id)

        # Pre-register all remote modules (they won't be used until set_execution_context is called)
        self.mock_connection.add_remote_module(TEST_MODULE)
        self.mock_connection.add_remote_module(TEST_PACKAGE, is_package=True)
        self.mock_connection.add_remote_module(f"{TEST_PACKAGE}.submodule")

        # Keep track of modules we create for cleanup
        self.test_modules = set()

        # Save original sys.meta_path
        self.original_meta_path = sys.meta_path.copy()

        # Register local finder at end (low priority, like default loaders)
        self.local_finder = MockLocalFinder()
        sys.meta_path.append(self.local_finder)

        # Register remote finder at start (high priority)
        finder = RemoteMetaPathFinder(self.mock_connection, self.plugin)
        sys.meta_path.insert(0, finder)

    def tearDown(self):
        """Clean up after each test"""
        # Remove test modules from sys.modules
        for module_name in list(sys.modules.keys()):
            if any(module_name.startswith(test_mod) for test_mod in self.test_modules):
                del sys.modules[module_name]

        # Restore original sys.meta_path
        sys.meta_path = self.original_meta_path

        # Clear plugin state
        self.plugin._execution_context_connection_id = None
        self.plugin._top_level_module_fullnames = set()

    def _create_local_module(self, name: str, is_package: bool = False):
        """Register a local module with the low-priority finder"""
        self.local_finder.add_module(name, is_package)
        self.test_modules.add(name)

    def _assert_import_is_local(self, module_name: str):
        """Import a module and assert it came from the local finder"""
        # Track for cleanup in tearDown since import_module will cache it in sys.modules
        self.test_modules.add(module_name)

        module = import_module(module_name)
        self.assertEqual(
            module.value, "local", f"Expected {module_name} to be local, got remote"
        )

    def _assert_import_is_remote(self, module_name: str):
        """Import a module and assert it came from the remote source"""
        # Track for cleanup in tearDown since import_module will cache it in sys.modules
        self.test_modules.add(module_name)

        module = import_module(module_name)
        self.assertEqual(
            module.value, "remote", f"Expected {module_name} to be remote, got local"
        )

    def test_case_1_local_exists_remote_lifecycle(self):
        """
        Test import behavior when a local module exists through the full remote lifecycle.
        Verifies: Local → remote override → local again
        """
        # Start with local module available
        self._create_local_module(TEST_MODULE)
        self._assert_import_is_local(TEST_MODULE)

        # Configure remote source (should evict local from cache)
        self.plugin.set_execution_context(self.connection_id, {TEST_MODULE})
        self._assert_import_is_remote(TEST_MODULE)

        # Remove remote configuration (should evict from cache and fall back to local)
        self.plugin.set_execution_context(self.connection_id, set())
        self._assert_import_is_local(TEST_MODULE)

    def test_case_2_local_not_exists_remote_lifecycle(self):
        """
        Test import behavior when no local module exists through the full remote lifecycle.
        Verifies: Fail → succeed with remote → fail when remote removed
        """
        # Import without local or remote - should fail
        with self.assertRaises(ModuleNotFoundError):
            import_module(TEST_MODULE)

        # Configure remote source
        self.plugin.set_execution_context(self.connection_id, {TEST_MODULE})
        self._assert_import_is_remote(TEST_MODULE)

        # Remove remote configuration - should fail again since no local module exists
        self.plugin.set_execution_context(self.connection_id, set())
        with self.assertRaises(ModuleNotFoundError):
            import_module(TEST_MODULE)

    def test_submodule_import_with_remote_source(self):
        """
        Test that submodule imports work correctly with remote sources
        """
        # Configure execution context for the package
        self.plugin.set_execution_context(self.connection_id, {TEST_PACKAGE})

        # Import package and submodule
        self._assert_import_is_remote(TEST_PACKAGE)
        self._assert_import_is_remote(f"{TEST_PACKAGE}.submodule")

    def test_connection_id_mismatch(self):
        """
        Test that modules aren't loaded when connection ID doesn't match
        """
        # Configure execution context with different connection ID
        self.plugin.set_execution_context("different-connection", {TEST_MODULE})

        # Import should fail because connection IDs don't match
        # The finder returns None, so standard import mechanism should fail
        with self.assertRaises(ModuleNotFoundError):
            import_module(TEST_MODULE)

    def test_dict_to_set_conversion(self):
        """
        Test that set_execution_context properly handles dict input
        (converted to set of keys)
        """
        # Pass a dict instead of a set (values should be ignored)
        self.plugin.set_execution_context(
            self.connection_id, {TEST_MODULE: "ignored_value"}
        )

        # Import should work
        self._assert_import_is_remote(TEST_MODULE)

    def test_evict_multiple_related_modules(self):
        """
        Test that eviction works for packages and their submodules
        """
        # Register local package and submodule with the finder
        self._create_local_module(TEST_PACKAGE, is_package=True)
        self._create_local_module(f"{TEST_PACKAGE}.submodule")

        # Import both to get them into sys.modules
        import_module(TEST_PACKAGE)
        import_module(f"{TEST_PACKAGE}.submodule")

        # Both should be in sys.modules
        self.assertIn(TEST_PACKAGE, sys.modules)
        self.assertIn(f"{TEST_PACKAGE}.submodule", sys.modules)

        # Set execution context - this should evict both modules
        self.plugin.set_execution_context(self.connection_id, {TEST_PACKAGE})

        # Both should have been evicted from sys.modules
        self.assertFalse(
            TEST_PACKAGE in sys.modules, f"{TEST_PACKAGE} should be evicted"
        )
        self.assertFalse(
            f"{TEST_PACKAGE}.submodule" in sys.modules,
            f"{TEST_PACKAGE}.submodule should be evicted",
        )


if __name__ == "__main__":
    unittest.main()
