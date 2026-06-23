from __future__ import annotations

from typing import Any, Callable, Dict, List
from unittest.mock import Mock

from deephaven.ui._internal.RenderContext import RenderContext, OnChangeCallable
from deephaven.ui._internal.EventContext import EventContext
from .BaseTest import BaseTestCase
from .test_utils_root import TestRoot

run_on_change: OnChangeCallable = lambda x: x()


def make_render_context(
    on_change: OnChangeCallable = run_on_change,
    on_queue: OnChangeCallable = run_on_change,
) -> RenderContext:
    return RenderContext(TestRoot(on_change, on_queue))


class UseQueryParamsTestCase(BaseTestCase):
    """Tests for the use_query_params hook."""

    def test_returns_query_params(self):
        from deephaven.ui.hooks.use_query_params import use_query_params

        rc = make_render_context()
        rc.set_url("https://example.com/app/-/page?page=2&sort=asc")
        with rc.open():
            result = use_query_params()
            self.assertEqual(result, {"page": ["2"], "sort": ["asc"]})

    def test_returns_empty_when_no_params(self):
        from deephaven.ui.hooks.use_query_params import use_query_params

        rc = make_render_context()
        rc.set_url("https://example.com/app/-/page")
        with rc.open():
            result = use_query_params()
            self.assertEqual(result, {})

    def test_returns_empty_when_no_url(self):
        from deephaven.ui.hooks.use_query_params import use_query_params

        rc = make_render_context()
        with rc.open():
            result = use_query_params()
            self.assertEqual(result, {})

    def test_multi_value_params(self):
        from deephaven.ui.hooks.use_query_params import use_query_params

        rc = make_render_context()
        rc.set_url("https://example.com/app?tag=python&tag=java")
        with rc.open():
            result = use_query_params()
            self.assertEqual(result, {"tag": ["python", "java"]})


class UseQueryParamTestCase(BaseTestCase):
    """Tests for the use_query_param hook."""

    def test_absent_key_returns_none(self):
        from deephaven.ui.hooks.use_query_param import use_query_param

        rc = make_render_context()
        rc.set_url("https://example.com/app?other=val")
        with rc.open():
            result = use_query_param("missing")
            self.assertIsNone(result)

    def test_absent_key_returns_list_default(self):
        from deephaven.ui.hooks.use_query_param import use_query_param

        rc = make_render_context()
        rc.set_url("https://example.com/app")
        with rc.open():
            result = use_query_param("missing", [])
            self.assertEqual(result, [])

    def test_present_key_no_value(self):
        """A key present with empty string value (e.g. ?foo) should return ''."""
        from deephaven.ui.hooks.use_query_param import use_query_param

        rc = make_render_context()
        rc.set_url("https://example.com/app?foo")
        with rc.open():
            result = use_query_param("foo")
            self.assertEqual(result, "")

    def test_present_key_single_value(self):
        from deephaven.ui.hooks.use_query_param import use_query_param

        rc = make_render_context()
        rc.set_url("https://example.com/app?page=3")
        with rc.open():
            result = use_query_param("page")
            self.assertEqual(result, "3")

    def test_multi_value_none_default_returns_last(self):
        """With default=None and multiple values, return the last value."""
        from deephaven.ui.hooks.use_query_param import use_query_param

        rc = make_render_context()
        rc.set_url("https://example.com/app?tag=python&tag=java")
        with rc.open():
            result = use_query_param("tag")
            self.assertEqual(result, "java")

    def test_multi_value_list_default_returns_all(self):
        from deephaven.ui.hooks.use_query_param import use_query_param

        rc = make_render_context()
        rc.set_url("https://example.com/app?tag=python&tag=java")
        with rc.open():
            result = use_query_param("tag", [])
            self.assertEqual(result, ["python", "java"])


class UseSetQueryParamTestCase(BaseTestCase):
    """Tests for the use_set_query_param hook."""

    def _setup_context_with_event(self, query_string=""):
        """Helper to set up a RenderContext + EventContext with a mock send_event.

        Args:
            query_string: Query string to include in the URL (e.g. "page=1&sort=asc").
        """
        rc = make_render_context()
        url = "https://example.com/app"
        if query_string:
            url += f"?{query_string}"
        rc.set_url(url)

        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        return rc, ec, send_event_mock

    def test_setter_sets_string_value(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event("page=1")
        with rc.open(), ec.open():
            setter = use_set_query_param("page")
            setter("2")

        send_event_mock.assert_called_once()
        name, payload = send_event_mock.call_args[0]
        self.assertEqual(name, "navigate.event")
        self.assertEqual(payload["queryParams"], "?page=2")
        self.assertNotIn("path", payload)
        self.assertNotIn("fragment", payload)
        self.assertTrue(payload["replace"])

    def test_setter_sets_list_value(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            setter = use_set_query_param("tag")
            setter(["python", "java"])

        send_event_mock.assert_called_once()
        _, payload = send_event_mock.call_args[0]
        self.assertEqual(payload["queryParams"], "?tag=python&tag=java")

    def test_setter_removes_with_none(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event("page=1&sort=asc")
        with rc.open(), ec.open():
            setter = use_set_query_param("page")
            setter(None)

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(payload["queryParams"], "?sort=asc")

    def test_setter_removes_with_empty_list(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event("page=1")
        with rc.open(), ec.open():
            setter = use_set_query_param("page")
            setter([])

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(payload["queryParams"], "")

    def test_setter_removes_with_no_args(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event("page=1")
        with rc.open(), ec.open():
            setter = use_set_query_param("page")
            setter()

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(payload["queryParams"], "")

    def test_setter_preserves_other_params(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event(
            "page=1&sort=asc&filter=active"
        )
        with rc.open(), ec.open():
            setter = use_set_query_param("page")
            setter("5")

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(
            payload["queryParams"],
            "?page=5&sort=asc&filter=active",
        )

    def test_setter_replace_false(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            setter = use_set_query_param("page")
            setter("1", replace=False)

        _, payload = send_event_mock.call_args[0]
        self.assertFalse(payload["replace"])

    def test_setter_adds_new_param(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event("existing=val")
        with rc.open(), ec.open():
            setter = use_set_query_param("new_key")
            setter("new_val")

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(
            payload["queryParams"],
            "?existing=val&new_key=new_val",
        )

    def test_setter_removes_with_empty_string(self):
        from deephaven.ui.hooks.use_set_query_param import use_set_query_param

        rc, ec, send_event_mock = self._setup_context_with_event("page=1")
        with rc.open(), ec.open():
            setter = use_set_query_param("page")
            setter("")

        _, payload = send_event_mock.call_args[0]
        self.assertEqual(payload["queryParams"], "?page=")
