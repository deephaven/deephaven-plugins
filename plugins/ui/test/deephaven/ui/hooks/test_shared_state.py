from __future__ import annotations

import threading
from operator import itemgetter
from unittest.mock import patch, MagicMock

from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class CreateGlobalStateTestCase(BaseTestCase):
    def test_initial_value(self):
        """Test that create_global_state returns the initial value on first render."""
        from deephaven.ui.hooks import create_global_state

        use_counter = create_global_state(42)

        def _hook():
            return use_counter()

        render_result = render_hook(_hook)
        value, set_value = render_result["result"]
        self.assertEqual(value, 42)

    def test_initial_value_callable(self):
        """Test that create_global_state accepts a callable as initial value."""
        from deephaven.ui.hooks import create_global_state

        use_store = create_global_state(lambda: {"a": 1, "b": 2})

        def _hook():
            return use_store()

        render_result = render_hook(_hook)
        value, _ = render_result["result"]
        self.assertEqual(value, {"a": 1, "b": 2})

        render_result["unmount"]()

    def test_initial_value_callable_called_once(self):
        """Test that a callable initial value is only invoked once at store creation."""
        from deephaven.ui.hooks import create_global_state

        call_count = 0

        def initializer():
            nonlocal call_count
            call_count += 1
            return 42

        use_store = create_global_state(initializer)
        self.assertEqual(call_count, 1)

        def _hook():
            return use_store()

        # Multiple renders should not call the initializer again
        result_a = render_hook(_hook)
        result_b = render_hook(_hook)
        self.assertEqual(call_count, 1)

        result_a["unmount"]()
        result_b["unmount"]()

    def test_initial_value_callable_reset(self):
        """Test that after all subscribers unmount, re-subscribing uses the already-resolved initial value."""
        from deephaven.ui.hooks import create_global_state

        call_count = 0

        def initializer():
            nonlocal call_count
            call_count += 1
            return 100

        use_store = create_global_state(initializer)
        self.assertEqual(call_count, 1)

        def _hook():
            return use_store()

        result = render_hook(_hook)
        _, set_value = result["result"]
        set_value(999)
        result["rerender"]()
        value, _ = result["result"]
        self.assertEqual(value, 999)

        # Unmount all subscribers
        result["unmount"]()

        # Re-subscribe - should get the resolved initial value (100), not re-call initializer
        result2 = render_hook(_hook)
        value2, _ = result2["result"]
        self.assertEqual(value2, 100)
        self.assertEqual(call_count, 1)  # Still only called once

        result2["unmount"]()

    def test_initial_value_none(self):
        """Test that create_global_state defaults to None when no initial value is given."""
        from deephaven.ui.hooks import create_global_state

        use_store = create_global_state()

        def _hook():
            return use_store()

        render_result = render_hook(_hook)
        value, _ = render_result["result"]
        self.assertIsNone(value)

    def test_set_value(self):
        """Test setting a new value and rerendering."""
        from deephaven.ui.hooks import create_global_state

        use_counter = create_global_state(0)

        def _hook():
            return use_counter()

        render_result = render_hook(_hook)
        value, set_value = render_result["result"]
        self.assertEqual(value, 0)

        # Set a new value and rerender
        set_value(10)
        render_result["rerender"]()
        value, set_value = render_result["result"]
        self.assertEqual(value, 10)

    def test_updater_function(self):
        """Test setting state with an updater function."""
        from deephaven.ui.hooks import create_global_state

        use_counter = create_global_state(5)

        def _hook():
            return use_counter()

        render_result = render_hook(_hook)
        value, set_value = render_result["result"]
        self.assertEqual(value, 5)

        # Use an updater function
        set_value(lambda prev: prev + 3)
        render_result["rerender"]()
        value, set_value = render_result["result"]
        self.assertEqual(value, 8)

    def test_shared_across_components(self):
        """Test that two render contexts share the same state."""
        from deephaven.ui.hooks import create_global_state

        use_shared = create_global_state(0)

        def _hook():
            return use_shared()

        # Render two independent "components" using the same store
        result_a = render_hook(_hook)
        result_b = render_hook(_hook)

        val_a, set_a = result_a["result"]
        val_b, set_b = result_b["result"]
        self.assertEqual(val_a, 0)
        self.assertEqual(val_b, 0)

        # Set value from component A
        set_a(99)

        # Rerender both
        result_a["rerender"]()
        result_b["rerender"]()

        val_a, _ = result_a["result"]
        val_b, _ = result_b["result"]
        self.assertEqual(val_a, 99)
        self.assertEqual(val_b, 99)

    def test_set_from_second_component(self):
        """Test that setting from the second component updates the first."""
        from deephaven.ui.hooks import create_global_state

        use_shared = create_global_state("hello")

        def _hook():
            return use_shared()

        result_a = render_hook(_hook)
        result_b = render_hook(_hook)

        _, set_b = result_b["result"]

        # Set value from component B
        set_b("world")

        result_a["rerender"]()
        result_b["rerender"]()

        val_a, _ = result_a["result"]
        val_b, _ = result_b["result"]
        self.assertEqual(val_a, "world")
        self.assertEqual(val_b, "world")

    def test_cleanup_resets_value(self):
        """Test that unmounting all subscribers resets the store to initial value."""
        from deephaven.ui.hooks import create_global_state

        use_shared = create_global_state(0)

        def _hook():
            return use_shared()

        result_a = render_hook(_hook)
        result_b = render_hook(_hook)

        _, set_a = result_a["result"]
        set_a(42)
        result_a["rerender"]()
        result_b["rerender"]()

        val_a, _ = result_a["result"]
        self.assertEqual(val_a, 42)

        # Unmount both subscribers
        result_a["unmount"]()
        result_b["unmount"]()

        # Re-subscribe with a new component - should get initial value
        result_c = render_hook(_hook)
        val_c, _ = result_c["result"]
        self.assertEqual(val_c, 0)

        result_c["unmount"]()

    def test_partial_unmount_preserves_state(self):
        """Test that unmounting one subscriber while another is active preserves state."""
        from deephaven.ui.hooks import create_global_state

        use_shared = create_global_state(0)

        def _hook():
            return use_shared()

        result_a = render_hook(_hook)
        result_b = render_hook(_hook)

        _, set_a = result_a["result"]
        set_a(77)
        result_a["rerender"]()
        result_b["rerender"]()

        # Unmount only component A
        result_a["unmount"]()

        # Component B should still have the value
        result_b["rerender"]()
        val_b, _ = result_b["result"]
        self.assertEqual(val_b, 77)

        # New component should also get the current value
        result_c = render_hook(_hook)
        val_c, _ = result_c["result"]
        self.assertEqual(val_c, 77)

        result_b["unmount"]()
        result_c["unmount"]()

    def test_multiple_sets_before_rerender(self):
        """Test that multiple set_value calls before rerender result in last value winning."""
        from deephaven.ui.hooks import create_global_state

        use_shared = create_global_state(0)

        def _hook():
            return use_shared()

        result = render_hook(_hook)
        _, set_value = result["result"]

        set_value(1)
        set_value(2)
        set_value(3)

        result["rerender"]()
        value, _ = result["result"]
        self.assertEqual(value, 3)

        result["unmount"]()

    def test_thread_safety(self):
        """Test concurrent set_value calls from multiple threads."""
        from deephaven.ui.hooks import create_global_state

        use_shared = create_global_state(0)

        def _hook():
            return use_shared()

        result = render_hook(_hook)
        _, set_value = result["result"]

        errors = []

        def increment():
            try:
                for _ in range(100):
                    set_value(lambda prev: prev + 1)
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=increment) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0)

        result["rerender"]()
        value, _ = result["result"]
        # 5 threads * 100 increments = 500
        self.assertEqual(value, 500)

        result["unmount"]()


class CreateUserStateTestCase(BaseTestCase):
    @patch.dict("sys.modules", {"deephaven_enterprise": None})
    def test_callable_initial_value(self):
        """Test that create_user_state accepts a callable as initial value."""
        from deephaven.ui.hooks import create_user_state

        call_count = 0

        def initializer():
            nonlocal call_count
            call_count += 1
            return [1, 2, 3]

        use_user_val = create_user_state(initializer)
        # Not called yet — user stores are created lazily
        self.assertEqual(call_count, 0)

        def _hook():
            return use_user_val()

        result = render_hook(_hook)
        value, _ = result["result"]
        self.assertEqual(value, [1, 2, 3])
        self.assertEqual(call_count, 1)

        result["unmount"]()

    def test_callable_initial_value_per_user(self):
        """Test that a callable initial value is invoked once per user."""
        from deephaven.ui.hooks import create_user_state

        call_count = 0

        def initializer():
            nonlocal call_count
            call_count += 1
            return {"data": []}

        use_user_val = create_user_state(initializer)

        mock_auth = MagicMock()

        def _hook():
            return use_user_val()

        # Render as user_a
        mock_auth.get_effective_user.return_value = "user_a"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            result_a = render_hook(_hook)
        self.assertEqual(call_count, 1)

        # Render as user_b
        mock_auth.get_effective_user.return_value = "user_b"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            result_b = render_hook(_hook)
        self.assertEqual(call_count, 2)

        val_a, _ = result_a["result"]
        val_b, _ = result_b["result"]
        # Each user should get an independent copy
        self.assertEqual(val_a, {"data": []})
        self.assertEqual(val_b, {"data": []})
        self.assertIsNot(val_a, val_b)  # Different objects

        result_a["unmount"]()
        result_b["unmount"]()

    @patch.dict("sys.modules", {"deephaven_enterprise": None})
    def test_fallback_without_enterprise(self):
        """Test that create_user_state falls back to anonymous when deephaven_enterprise is not available."""
        from deephaven.ui.hooks import create_user_state

        use_user_val = create_user_state("default")

        def _hook():
            return use_user_val()

        result = render_hook(_hook)
        value, set_value = result["result"]
        self.assertEqual(value, "default")

        set_value("updated")
        result["rerender"]()
        value, _ = result["result"]
        self.assertEqual(value, "updated")

        result["unmount"]()

    def test_user_isolation(self):
        """Test that different users get independent state."""
        from deephaven.ui.hooks import create_user_state

        use_user_val = create_user_state(0)

        mock_auth = MagicMock()

        def _hook():
            return use_user_val()

        # Render as user_a
        mock_auth.get_effective_user.return_value = "user_a"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            result_a = render_hook(_hook)

        val_a, set_a = result_a["result"]
        self.assertEqual(val_a, 0)

        # Render as user_b
        mock_auth.get_effective_user.return_value = "user_b"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            result_b = render_hook(_hook)

        val_b, set_b = result_b["result"]
        self.assertEqual(val_b, 0)

        # Set value for user_a only
        mock_auth.get_effective_user.return_value = "user_a"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            set_a(42)
            result_a["rerender"]()

        val_a, _ = result_a["result"]
        self.assertEqual(val_a, 42)

        # user_b should still be 0
        mock_auth.get_effective_user.return_value = "user_b"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            result_b["rerender"]()

        val_b, _ = result_b["result"]
        self.assertEqual(val_b, 0)

        result_a["unmount"]()
        result_b["unmount"]()

    def test_user_cleanup_removes_store(self):
        """Test that unmounting all subscribers for a user cleans up that user's store."""
        from deephaven.ui.hooks import create_user_state

        use_user_val = create_user_state(0)

        mock_auth = MagicMock()

        def _hook():
            return use_user_val()

        # Render as user_a and set value
        mock_auth.get_effective_user.return_value = "user_a"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            result_a = render_hook(_hook)

        _, set_a = result_a["result"]
        set_a(99)
        mock_auth.get_effective_user.return_value = "user_a"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            result_a["rerender"]()
        val_a, _ = result_a["result"]
        self.assertEqual(val_a, 99)

        # Unmount user_a
        result_a["unmount"]()

        # Re-render as user_a - should get initial value since store was cleaned up
        mock_auth.get_effective_user.return_value = "user_a"
        with patch.dict(
            "sys.modules",
            {
                "deephaven_enterprise": MagicMock(),
                "deephaven_enterprise.auth_context": mock_auth,
            },
        ):
            result_a2 = render_hook(_hook)

        val_a2, _ = result_a2["result"]
        self.assertEqual(val_a2, 0)

        result_a2["unmount"]()
