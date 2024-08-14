from __future__ import annotations
import itertools
from typing import Any, Callable, Union
from unittest.mock import Mock
from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class UseEffectTestCase(BaseTestCase):
    def reset_mocks(self):
        self.called_funcs.clear()
        self.render_start.reset_mock()
        self.render_end.reset_mock()
        self.cleanup.reset_mock()
        self.effect.reset_mock()

    def make_effect(
        self, name: str = "effect", cleanup: Union[Callable[[], None], None] = None
    ):
        if cleanup is None:
            cleanup = self.cleanup

        def effect():
            self.called_funcs.append(name)
            return cleanup

        return Mock(side_effect=effect)

    def setUp(self) -> None:
        # Used to make sure functions are called in the correct order
        self.called_funcs: list[str] = []

        self.render_start = Mock(
            side_effect=lambda: self.called_funcs.append("render_start")
        )
        self.render_end = Mock(
            side_effect=lambda: self.called_funcs.append("render_end")
        )
        self.cleanup = Mock(side_effect=lambda: self.called_funcs.append("cleanup"))
        self.effect = self.make_effect()

        return super().setUp()

    def _test_use_effect(
        self,
        effect: Union[Callable[[], Callable[[], None]], None] = None,
        dependencies: Any = None,
    ):
        if effect is None:
            effect = self.effect

        from deephaven.ui.hooks import use_effect

        self.render_start()
        use_effect(effect, dependencies)
        self.render_end()

    def test_no_dependencies(self) -> None:
        """
        Test the use_effect hook with no dependencies.
        Should call the effect each time after the render, and the previous cleanup before that
        """
        result = render_hook(self._test_use_effect)
        self.assertEqual(result["result"], None)
        self.assertEqual(self.effect.call_count, 1)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(self.called_funcs, ["render_start", "render_end", "effect"])

        self.reset_mocks()

        cleanup2 = Mock(side_effect=lambda: self.called_funcs.append("cleanup2"))
        effect2 = self.make_effect("effect2", cleanup2)

        # Re-render with no dependencies still
        rerender_result = result["rerender"](effect=effect2)
        self.assertEqual(rerender_result, None)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(effect2.call_count, 1)
        # Make sure the old cleanup was called before the new effect
        self.assertEqual(self.cleanup.call_count, 1)
        self.assertEqual(cleanup2.call_count, 0)
        self.assertEqual(
            self.called_funcs, ["render_start", "render_end", "cleanup", "effect2"]
        )

        self.reset_mocks()
        cleanup2.reset_mock()
        effect2.reset_mock()

        # Now unmount
        result["unmount"]()
        self.assertEqual(self.render_start.call_count, 0)
        self.assertEqual(self.render_end.call_count, 0)
        self.assertEqual(effect2.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(cleanup2.call_count, 1)
        self.assertEqual(self.called_funcs, ["cleanup2"])

    def test_empty_dependencies(self) -> None:
        """
        Test the use_effect hook with empty dependencies.
        It should call the effect once on mount, and cleanup once on unmount.
        """
        result = render_hook(self._test_use_effect, dependencies=[])
        self.assertEqual(result["result"], None)
        self.assertEqual(self.effect.call_count, 1)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(self.called_funcs, ["render_start", "render_end", "effect"])

        self.reset_mocks()

        # Re-render with empty dependencies. Should not call the effect again
        rerender_result = result["rerender"](dependencies=[])
        self.assertEqual(rerender_result, None)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(self.called_funcs, ["render_start", "render_end"])

        self.reset_mocks()

        # Now unmount
        result["unmount"]()
        self.assertEqual(self.render_start.call_count, 0)
        self.assertEqual(self.render_end.call_count, 0)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 1)
        self.assertEqual(self.called_funcs, ["cleanup"])

    def test_dependencies(self) -> None:
        """
        Test the use_effect hook with dependencies.
        It should call the effect only when the dependencies are changed, and when the component mounts.
        It should call the previous cleanup when dependencies are changed, and when the component unmounts.
        """
        self.reset_mocks()

        result = render_hook(self._test_use_effect, dependencies=[1])
        self.assertEqual(result["result"], None)
        self.assertEqual(self.effect.call_count, 1)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(self.called_funcs, ["render_start", "render_end", "effect"])

        self.reset_mocks()

        # Re-render with the same dependencies. Should not call the effect again
        rerender_result = result["rerender"](dependencies=[1])
        self.assertEqual(rerender_result, None)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(self.called_funcs, ["render_start", "render_end"])

        self.reset_mocks()
        cleanup2 = Mock(side_effect=lambda: self.called_funcs.append("cleanup2"))
        effect2 = self.make_effect("effect2", cleanup2)

        # Re-render with different dependencies. Should call the effect again, and cleanup the old effect
        rerender_result = result["rerender"](effect=effect2, dependencies=[2])
        self.assertEqual(rerender_result, None)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(effect2.call_count, 1)
        self.assertEqual(self.cleanup.call_count, 1)
        self.assertEqual(cleanup2.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(
            self.called_funcs, ["render_start", "render_end", "cleanup", "effect2"]
        )

        self.reset_mocks()
        cleanup2.reset_mock()
        effect2.reset_mock()

        # Now unmount
        result["unmount"]()
        self.assertEqual(self.render_start.call_count, 0)
        self.assertEqual(self.render_end.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(effect2.call_count, 0)
        self.assertEqual(cleanup2.call_count, 1)
        self.assertEqual(self.called_funcs, ["cleanup2"])
