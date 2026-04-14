from operator import itemgetter
from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class UseContextTestCase(BaseTestCase):
    def test_default_value(self):
        """use_context returns the default value when no provider is active."""
        from deephaven.ui.hooks import use_context
        from deephaven.ui.elements import create_context

        ctx = create_context("default_val")

        def _test():
            return use_context(ctx)

        render_result = render_hook(_test)
        result = render_result["result"]
        self.assertEqual(result, "default_val")

    def test_multiple_contexts_independent(self):
        """Different Context objects don't interfere with each other."""
        from deephaven.ui.hooks import use_context
        from deephaven.ui.elements import create_context

        ctx_a = create_context("default_a")
        ctx_b = create_context("default_b")

        def _test():
            # Only ctx_a is provided via default — ctx_b should also return its default
            return use_context(ctx_a), use_context(ctx_b)

        render_result = render_hook(_test)
        a_val, b_val = render_result["result"]
        self.assertEqual(a_val, "default_a")
        self.assertEqual(b_val, "default_b")

    def test_element_provider_returns_element(self):
        """Calling context(value, child) returns a ContextProviderElement."""
        from deephaven.ui.elements import create_context, ContextProviderElement

        ctx = create_context("default")
        provider = ctx(99, "child_placeholder")
        self.assertIsInstance(provider, ContextProviderElement)

    def test_shared_stacks_no_per_instance_local(self):
        """Context stacks are stored in the shared _local_data, not per-Context threading.local."""
        from deephaven.ui.elements import create_context

        ctx = create_context("default")
        self.assertFalse(
            hasattr(ctx, "_local"),
            "Context should not have a per-instance threading.local",
        )

    def test_rerender_preserves_context_isolation(self):
        """Context values don't leak across rerenders — default is restored after each render."""
        from deephaven.ui.hooks import use_context, use_state
        from deephaven.ui.elements import create_context

        ctx = create_context(0)

        def _test():
            count, set_count = use_state(0)
            # Outside any provider, should be default
            val = use_context(ctx)
            return val, set_count

        render_result = render_hook(_test)
        val, set_count = render_result["result"]
        self.assertEqual(val, 0)

        set_count(5)
        render_result["rerender"]()
        val, set_count = render_result["result"]
        # Still default — no provider was active
        self.assertEqual(val, 0)
