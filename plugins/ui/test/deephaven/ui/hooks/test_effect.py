from __future__ import annotations
import itertools
from typing import Any, Callable, Union
from unittest.mock import Mock
from ..BaseTest import BaseTestCase
from .render_utils import render_hook


class UseEffectTestCase(BaseTestCase):
    def reset_counter(self):
        self.counter = itertools.count()

    def reset_mocks(self):
        self.reset_counter()
        self.render_start.reset_mock()
        self.render_end.reset_mock()
        self.cleanup.reset_mock()
        self.effect.reset_mock()

    def setUp(self) -> None:
        self.counter = itertools.count()

        self.inc_counter = lambda: next(self.counter)
        self.render_start = Mock(side_effect=self.inc_counter)
        self.render_end = Mock(side_effect=self.inc_counter)
        self.cleanup = Mock(side_effect=self.inc_counter)
        self.effect = Mock(return_value=self.cleanup, side_effect=self.inc_counter)

        return super().setUp()

    def tearDown(self) -> None:
        return super().tearDown()

    # def test_use_effect(self):

    def _test_use_effect(
        self,
        effect: Union[Callable[[], Callable[[], None]], None] = None,
        dependencies: Union[None, Any] = None,
    ):
        if effect is None:
            effect = self.effect

        from deephaven.ui.hooks import use_effect

        # from deephaven.ui.types import Dependencies
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
        self.assertEqual(self.render_start.call_args_list[0], 0)
        self.assertEqual(self.render_end.call_args_list[0], 1)
        self.assertEqual(self.effect.call_args_list[0], 2)

        self.reset_mocks()

        cleanup2 = Mock(side_effect=self.inc_counter)
        effect2 = Mock(return_value=cleanup2, side_effect=self.inc_counter)

        # Re-render with no dependencies still
        rerender_result = result["rerender"](effect2)
        self.assertEqual(rerender_result, None)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(effect2.call_count, 1)
        # Make sure the old cleanup was called before the new effect
        self.assertEqual(self.cleanup.call_count, 1)
        self.assertEqual(cleanup2.call_count, 0)
        self.assertEqual(self.render_start.call_args_list[0], 0)
        self.assertEqual(self.render_end.call_args_list[0], 1)
        self.assertEqual(self.cleanup.call_args_list[0], 2)
        self.assertEqual(effect2.call_args_list[0], 3)

        self.reset_mocks()

        # Now unmount
        result["unmount"]()
        self.assertEqual(self.render_start.call_count, 0)
        self.assertEqual(self.render_end.call_count, 0)
        self.assertEqual(effect2.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(cleanup2.call_count, 1)
        self.assertEqual(self.cleanup.call_args_list[0], 0)

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
        self.assertEqual(self.render_start.call_args_list[0], 0)
        self.assertEqual(self.render_end.call_args_list[0], 1)
        self.assertEqual(self.effect.call_args_list[0], 2)

        self.reset_mocks()

        # Re-render with empty dependencies. Should not call the effect again
        rerender_result = result["rerender"](dependencies=[])
        self.assertEqual(rerender_result, None)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(self.render_start.call_args_list[0], 0)
        self.assertEqual(self.render_end.call_args_list[0], 1)

        self.reset_mocks()

        # Now unmount
        result["unmount"]()
        self.assertEqual(self.render_start.call_count, 0)
        self.assertEqual(self.render_end.call_count, 0)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 1)
        self.assertEqual(self.cleanup.call_args_list[0], 0)

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
        self.assertEqual(self.render_start.call_args_list[0], 0)
        self.assertEqual(self.render_end.call_args_list[0], 1)
        self.assertEqual(self.effect.call_args_list[0], 2)

        self.reset_mocks()

        # Re-render with the same dependencies. Should not call the effect again
        rerender_result = result["rerender"](dependencies=[1])
        self.assertEqual(rerender_result, None)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(self.cleanup.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(self.render_start.call_args_list[0], 0)
        self.assertEqual(self.render_end.call_args_list[0], 1)

        self.reset_mocks()
        cleanup2 = Mock(side_effect=self.inc_counter)
        effect2 = Mock(return_value=cleanup2, side_effect=self.inc_counter)

        # Re-render with different dependencies. Should call the effect again, and cleanup the old effect
        rerender_result = result["rerender"](effect2, [2])
        self.assertEqual(rerender_result, None)
        self.assertEqual(self.effect.call_count, 0)
        self.assertEqual(effect2.call_count, 1)
        self.assertEqual(self.cleanup.call_count, 1)
        self.assertEqual(cleanup2.call_count, 0)
        self.assertEqual(self.render_start.call_count, 1)
        self.assertEqual(self.render_end.call_count, 1)
        self.assertEqual(self.render_start.call_args_list[0], 0)
        self.assertEqual(self.render_end.call_args_list[0], 1)
        self.assertEqual(effect2.call_args_list[0], 2)
        self.assertEqual(self.cleanup.call_args_list[0], 3)

        self.reset_mocks()

        # Now unmount
        result["unmount"]()
        self.assertEqual(self.render_start.call_count, 0)
        self.assertEqual(self.render_end.call_count, 0)
        self.assertEqual(effect2.call_count, 0)
        self.assertEqual(cleanup2.call_count, 1)
        self.assertEqual(cleanup2.call_args_list[0], 0)
