from ..BaseTest import BaseTestCase
from .render_utils import render_hook
from deephaven.ui.renderer.Renderer import Renderer
from deephaven.ui._internal.RenderContext import RenderContext
from deephaven import ui

from ..test_utils_root import TestRoot


class UseContextTestCase(BaseTestCase):
    def test_default_value(self):
        """use_context returns the default value when no provider is active."""
        from deephaven.ui.elements import create_context

        ctx = create_context("default_val")

        def _test():
            return ui.use_context(ctx)

        render_result = render_hook(_test)
        self.assertEqual(render_result["result"], "default_val")

    def test_default_none(self):
        """create_context(None) gives a context whose default is None."""
        ctx = ui.create_context(None)

        def _test():
            return ui.use_context(ctx)

        render_result = render_hook(_test)
        self.assertIsNone(render_result["result"])

    def test_provider_supplies_value_to_child(self):
        """A ContextProviderElement makes the provided value visible to use_context in a child component."""
        ctx = ui.create_context("default")

        @ui.component
        def consumer():
            value = ui.use_context(ctx)
            return ui.text(value)

        @ui.component
        def app():
            return ctx(consumer(), value="provided")

        rc = RenderContext(TestRoot)
        result = Renderer(rc).render(app())

        # The text child should have received "provided", not "default"
        # app -> provider -> consumer -> text
        provider_node = result.props["children"]
        consumer_node = provider_node.props["children"]
        text_node = consumer_node.props["children"]
        self.assertEqual(text_node.props["children"], ["provided"])

    def test_provider_does_not_leak_outside_subtree(self):
        """The provided value is not visible to siblings rendered after the provider."""
        ctx = ui.create_context("default")

        @ui.component
        def consumer():
            value = ui.use_context(ctx)
            return ui.text(value)

        @ui.component
        def app():
            return [
                ctx(consumer(), value="provided"),
                consumer(),  # sibling — should see "default"
            ]

        rc = RenderContext(TestRoot)
        result = Renderer(rc).render(app())

        children = result.props["children"]
        # children[0]: provider -> consumer -> text
        inside_text = children[0].props["children"].props["children"]
        # children[1]: consumer -> text
        outside_text = children[1].props["children"]
        self.assertEqual(inside_text.props["children"], ["provided"])
        self.assertEqual(outside_text.props["children"], ["default"])

    def test_nested_providers_inner_wins(self):
        """The innermost provider's value is what use_context sees."""
        ctx = ui.create_context("default")

        @ui.component
        def consumer():
            value = ui.use_context(ctx)
            return ui.text(value)

        @ui.component
        def inner():
            return ctx(consumer(), value="inner")

        @ui.component
        def app():
            return ctx(inner(), value="outer")

        rc = RenderContext(TestRoot)
        result = Renderer(rc).render(app())

        # app -> outer provider -> inner() -> inner provider -> consumer() -> text
        outer_provider = result.props["children"]
        inner_node = outer_provider.props["children"]
        inner_provider = inner_node.props["children"]
        consumer_node = inner_provider.props["children"]
        text_node = consumer_node.props["children"]
        self.assertEqual(text_node.props["children"], ["inner"])

    def test_multiple_contexts_independent(self):
        """Two independent contexts don't interfere with each other."""
        ctx_a = ui.create_context("a_default")
        ctx_b = ui.create_context("b_default")

        @ui.component
        def consumer():
            a = ui.use_context(ctx_a)
            b = ui.use_context(ctx_b)
            value = f"{a},{b}"
            return ui.text(value)

        @ui.component
        def app():
            return ctx_a(ctx_b(consumer(), value="b_provided"), value="a_provided")

        rc = RenderContext(TestRoot)
        result = Renderer(rc).render(app())

        # app -> provider_a -> provider_b -> consumer -> text
        provider_a = result.props["children"]
        provider_b = provider_a.props["children"]
        consumer_node = provider_b.props["children"]
        text_node = consumer_node.props["children"]
        self.assertEqual(text_node.props["children"], ["a_provided,b_provided"])

    def test_outer_context_restored_after_inner_provider(self):
        """After an inner provider's subtree, the outer provided value is restored."""
        ctx = ui.create_context("default")

        @ui.component
        def consumer(label: str):
            value = ui.use_context(ctx)
            return ui.text(f"{label}:{value}")

        @ui.component
        def app():
            return ctx(
                ctx(consumer("in"), value="inner"),  # should see "inner"
                consumer("after"),  # should see "outer" again
                value="outer",
            )

        rc = RenderContext(TestRoot)
        result = Renderer(rc).render(app())

        # app -> outer provider -> [inner provider, after consumer]
        outer_provider = result.props["children"]
        children = outer_provider.props["children"]
        # children[0]: inner provider -> consumer -> text
        inner_text = children[0].props["children"].props["children"]
        # children[1]: consumer -> text
        after_text = children[1].props["children"]
        self.assertEqual(inner_text.props["children"], ["in:inner"])
        self.assertEqual(after_text.props["children"], ["after:outer"])
