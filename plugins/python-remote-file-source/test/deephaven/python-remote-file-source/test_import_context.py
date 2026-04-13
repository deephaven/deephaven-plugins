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
from types import ModuleType
from typing import Optional

from src.deephaven.python_remote_file_source.plugin_object import PluginObject
from src.deephaven.python_remote_file_source.module_loader import RemoteMetaPathFinder
from src.deephaven.python_remote_file_source.json_rpc import (
    JsonRpcRequest,
    JsonRpcResponse,
)

# Test module name constants
TEST_MODULE = "test_module"
TEST_PACKAGE = "test_package"


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

        # Keep track of modules we create for cleanup
        self.test_modules = set()

        # Save original sys.meta_path
        self.original_meta_path = sys.meta_path.copy()

        # Register remote finder for all tests
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

    def _create_local_module(self, name: str) -> ModuleType:
        """Create a local module in sys.modules for testing"""
        module = ModuleType(name)
        module.__file__ = f"<local:{name}>"
        exec(compile("value = 'local'", module.__file__, "exec"), module.__dict__)
        sys.modules[name] = module
        self.test_modules.add(name)
        return module

    def test_case_1a_local_exists_no_remote_configured(self):
        """
        Case 1a: Local version exists, no remote source configured
        Expected: Local module gets loaded
        """
        # Create a local module
        self._create_local_module(TEST_MODULE)

        # Don't call set_execution_context, so no remote modules are configured
        # Import should use local module
        module = import_module(TEST_MODULE)

        self.assertEqual(module.value, "local")
        self.assertIsNotNone(module.__file__)
        self.assertIn("local", module.__file__)  # type: ignore

    def test_case_1b_local_exists_remote_configured(self):
        """
        Case 1b: Local version exists, remote source configured
        Expected: Remote module gets loaded (overrides local)
        """
        # Create a local module
        self._create_local_module(TEST_MODULE)

        # Configure remote module
        self.mock_connection.add_remote_module(TEST_MODULE)

        # Configure execution context to use remote source
        self.plugin.set_execution_context(self.connection_id, {TEST_MODULE})

        # Import should use remote module
        module = import_module(TEST_MODULE)

        self.assertEqual(module.value, "remote")
        # Check __spec__.origin since remote modules may not have __file__
        self.assertIsNotNone(module.__spec__)
        if module.__spec__ is not None:
            self.assertIsNotNone(module.__spec__.origin)
            self.assertIn("remote", module.__spec__.origin)  # type: ignore

    def test_case_1c_local_exists_remote_removed(self):
        """
        Case 1c: Local version exists, remote source was configured but now removed
        Expected: Local module gets loaded
        """
        # Create a local module FIRST (before registering finder)
        local_module = self._create_local_module(TEST_MODULE)

        # Configure and then remove remote module
        self.mock_connection.add_remote_module(TEST_MODULE)

        # First: Configure execution context to use remote source
        # This should evict the local module from cache
        self.plugin.set_execution_context(self.connection_id, {TEST_MODULE})
        module = import_module(TEST_MODULE)
        self.assertEqual(module.value, "remote")

        # Second: Remove remote configuration (clear execution context)
        # This should evict the remote module from cache
        self.plugin.set_execution_context(self.connection_id, set())

        # RE-CREATE the local module since it was evicted
        self._create_local_module(TEST_MODULE)

        # Import should now use local module
        module = import_module(TEST_MODULE)
        self.assertEqual(module.value, "local")
        self.assertIsNotNone(module.__file__)
        self.assertIn("local", module.__file__)  # type: ignore

    def test_case_2a_local_not_exists_no_remote_configured(self):
        """
        Case 2a: Local version doesn't exist, no remote source configured
        Expected: ImportError
        """
        # Don't configure any remote modules
        # Import should fail
        with self.assertRaises(ModuleNotFoundError):
            import_module("nonexistent_module_2a")

    def test_case_2b_local_not_exists_remote_configured(self):
        """
        Case 2b: Local version doesn't exist, remote source configured
        Expected: Remote module gets loaded
        """
        # Configure remote module (no local version)
        self.mock_connection.add_remote_module(TEST_MODULE)

        # Configure execution context to use remote source
        self.plugin.set_execution_context(self.connection_id, {TEST_MODULE})

        # Import should use remote module
        self.test_modules.add(TEST_MODULE)  # Track for cleanup
        module = import_module(TEST_MODULE)

        self.assertEqual(module.value, "remote")
        # Check __spec__.origin since remote modules may not have __file__
        self.assertIsNotNone(module.__spec__)
        if module.__spec__ is not None:
            self.assertIsNotNone(module.__spec__.origin)
            self.assertIn("remote", module.__spec__.origin)  # type: ignore

    def test_case_2c_local_not_exists_remote_removed(self):
        """
        Case 2c: Local version doesn't exist, remote source was configured but now removed
        Expected: ImportError
        """
        # Configure remote module (no local version)
        self.mock_connection.add_remote_module(TEST_MODULE)

        # First: Configure execution context to use remote source
        self.plugin.set_execution_context(self.connection_id, {TEST_MODULE})
        self.test_modules.add(TEST_MODULE)  # Track for cleanup
        module = import_module(TEST_MODULE)
        self.assertEqual(module.value, "remote")

        # Second: Remove remote configuration
        self.plugin.set_execution_context(self.connection_id, set())

        # Import should now fail
        with self.assertRaises(ModuleNotFoundError):
            import_module(TEST_MODULE)

    def test_cache_eviction_on_context_change(self):
        """
        Test that module cache is properly evicted when execution context changes
        """
        # Create a local module
        self._create_local_module(TEST_MODULE)

        # Configure remote module
        self.mock_connection.add_remote_module(TEST_MODULE)

        # First import: no remote configured, should get local
        module1 = import_module(TEST_MODULE)
        self.assertEqual(module1.value, "local")

        # Configure remote source
        self.plugin.set_execution_context(self.connection_id, {TEST_MODULE})

        # Second import: remote configured, should get remote (cache should be evicted)
        module2 = import_module(TEST_MODULE)
        self.assertEqual(module2.value, "remote")

        # Clear remote source and re-create local module
        self.plugin.set_execution_context(self.connection_id, set())
        self._create_local_module(TEST_MODULE)

        # Third import: no remote, should get local again (cache evicted again)
        module3 = import_module(TEST_MODULE)
        self.assertEqual(module3.value, "local")

    def test_submodule_import_with_remote_source(self):
        """
        Test that submodule imports work correctly with remote sources
        """
        # Configure remote package and submodule
        self.mock_connection.add_remote_module(TEST_PACKAGE, is_package=True)
        self.mock_connection.add_remote_module(f"{TEST_PACKAGE}.submodule")

        # Configure execution context for the package
        self.plugin.set_execution_context(self.connection_id, {TEST_PACKAGE})

        # Import package and submodule
        self.test_modules.add(TEST_PACKAGE)
        package = import_module(TEST_PACKAGE)
        self.assertEqual(package.value, "remote")

        submodule = import_module(f"{TEST_PACKAGE}.submodule")
        self.assertEqual(submodule.value, "remote")

    def test_connection_id_mismatch(self):
        """
        Test that modules aren't loaded when connection ID doesn't match
        """
        # Configure remote module
        self.mock_connection.add_remote_module(TEST_MODULE)

        # Configure execution context with different connection ID
        different_connection_id = "different-connection"
        self.plugin.set_execution_context(different_connection_id, {TEST_MODULE})

        # Import should fail because connection IDs don't match
        # The finder returns None, so standard import mechanism should fail
        with self.assertRaises(ModuleNotFoundError):
            import_module(TEST_MODULE)

    def test_dict_to_set_conversion(self):
        """
        Test that set_execution_context properly handles dict input
        (converted to set of keys)
        """
        # Configure remote module
        self.mock_connection.add_remote_module(TEST_MODULE)

        # Pass a dict instead of a set (values should be ignored)
        self.plugin.set_execution_context(
            self.connection_id, {TEST_MODULE: "ignored_value"}
        )

        # Import should work
        self.test_modules.add(TEST_MODULE)
        module = import_module(TEST_MODULE)
        self.assertEqual(module.value, "remote")

    def test_evict_multiple_related_modules(self):
        """
        Test that eviction works for packages and their submodules
        """
        # Create local package and submodule
        pkg = self._create_local_module(TEST_PACKAGE)
        sub = self._create_local_module(f"{TEST_PACKAGE}.submodule")

        # Both should be in sys.modules
        self.assertIn(TEST_PACKAGE, sys.modules)
        self.assertIn(f"{TEST_PACKAGE}.submodule", sys.modules)

        # Configure remote versions
        self.mock_connection.add_remote_module(TEST_PACKAGE, is_package=True)
        self.mock_connection.add_remote_module(f"{TEST_PACKAGE}.submodule")

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
