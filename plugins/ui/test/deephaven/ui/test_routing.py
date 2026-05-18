from __future__ import annotations

from typing import Any, Dict, List
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


# ────────────────────────────────────────────────────────────────────
# RenderContext — URL state import / export
# ────────────────────────────────────────────────────────────────────


class UrlStateRenderContextTestCase(BaseTestCase):
    """Tests for URL state on RenderContext (only url is stored)."""

    def test_default_url_is_empty(self):
        rc = make_render_context()
        self.assertEqual(rc.get_url(), "")

    def test_import_state_with_url(self):
        rc = make_render_context()
        state: Dict[str, Any] = {
            "__url": "https://example.com/widget/-/page?q=1#sec",
        }
        rc.import_state(state)
        self.assertEqual(
            rc.get_url(),
            "https://example.com/widget/-/page?q=1#sec",
        )

    def test_import_state_preserves_url_when_absent(self):
        rc = make_render_context()
        rc.import_state({"__url": "https://example.com/app/-/page1"})
        self.assertEqual(rc.get_url(), "https://example.com/app/-/page1")
        # Import without __url should preserve
        rc.import_state({})
        self.assertEqual(rc.get_url(), "https://example.com/app/-/page1")

    def test_url_fields_not_in_exported_state(self):
        rc = make_render_context()
        state: Dict[str, Any] = {
            "__url": "https://example.com/app/-/dashboard#top",
            "state": {"0": 42},
        }
        rc.import_state(state)
        exported = rc.export_state()
        self.assertNotIn("__url", exported)

    def test_child_context_reads_url_from_root(self):
        rc = make_render_context()
        rc.import_state(
            {
                "__url": "https://example.com/app/-/users#details",
            }
        )
        with rc.open():
            child = rc.get_child_context("child0")
            self.assertEqual(child.get_url(), "https://example.com/app/-/users#details")


# ────────────────────────────────────────────────────────────────────
# use_path
# ────────────────────────────────────────────────────────────────────


class UsePathTestCase(BaseTestCase):
    """Tests for the use_path hook."""

    def test_returns_relative_path(self):
        from deephaven.ui.hooks.use_path import use_path

        rc = make_render_context()
        rc.import_state({"__url": "https://example.com/app/-/dashboard/settings"})
        with rc.open():
            result = use_path()
            self.assertEqual(result, "/dashboard/settings")

    def test_returns_root_when_no_url(self):
        from deephaven.ui.hooks.use_path import use_path

        rc = make_render_context()
        rc.import_state({})
        with rc.open():
            result = use_path()
            self.assertEqual(result, "/")

    def test_returns_root_when_no_separator(self):
        from deephaven.ui.hooks.use_path import use_path

        rc = make_render_context()
        rc.import_state({"__url": "https://example.com/app/page"})
        with rc.open():
            result = use_path()
            self.assertEqual(result, "/")

    def test_returns_absolute_path(self):
        from deephaven.ui.hooks.use_path import use_path

        rc = make_render_context()
        rc.import_state(
            {"__url": "https://example.com/iriside/embed/widget/q/w/-/page"}
        )
        with rc.open():
            result = use_path(absolute=True)
            self.assertEqual(result, "/iriside/embed/widget/q/w/-/page")

    def test_returns_root_relative_at_separator_boundary(self):
        from deephaven.ui.hooks.use_path import use_path

        rc = make_render_context()
        rc.import_state({"__url": "https://example.com/app/-/"})
        with rc.open():
            result = use_path()
            self.assertEqual(result, "/")


# ────────────────────────────────────────────────────────────────────
# use_navigate
# ────────────────────────────────────────────────────────────────────


class UseNavigateTestCase(BaseTestCase):
    """Tests for the use_navigate hook."""

    def _setup_context_with_event(self, state=None):
        rc = make_render_context()
        if state:
            rc.import_state(state)
        else:
            rc.import_state({})
        send_event_mock = Mock()
        ec = EventContext(send_event_mock)
        return rc, ec, send_event_mock

    def test_navigate_path_only(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate("/dashboard")

        mock.assert_called_once()
        name, payload = mock.call_args[0]
        self.assertEqual(name, "navigate.event")
        self.assertEqual(payload["path"], "/dashboard")
        self.assertRaises(KeyError, lambda: payload["queryParams"])
        self.assertRaises(KeyError, lambda: payload["fragment"])

    def test_navigate_path_with_inline_query(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate("/dashboard?tab=1#section")

        _, payload = mock.call_args[0]
        self.assertEqual(payload["path"], "/dashboard")
        self.assertEqual(payload["queryParams"], "?tab=1")
        self.assertEqual(payload["fragment"], "section")

    def test_navigate_explicit_overrides_inline(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate(
                "/page?inline=val#inline_frag",
                query_params={"explicit": ["true"]},
                fragment="explicit_frag",
            )

        _, payload = mock.call_args[0]
        self.assertEqual(payload["path"], "/page")
        self.assertEqual(payload["queryParams"], "?explicit=true")
        self.assertEqual(payload["fragment"], "explicit_frag")

    def test_navigate_query_only_preserves_path(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate(query_params={"tag": ["python", "java"]})

        _, payload = mock.call_args[0]
        self.assertNotIn("path", payload)
        self.assertEqual(payload["queryParams"], "?tag=python&tag=java")
        # Fragment should be preserved (not in payload)
        self.assertNotIn("fragment", payload)

    def test_navigate_fragment_only(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate(fragment="section-2")

        _, payload = mock.call_args[0]
        self.assertNotIn("path", payload)
        self.assertNotIn("queryParams", payload)
        self.assertEqual(payload["fragment"], "section-2")

    def test_navigate_clear_query_params(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate(query_params="")

        _, payload = mock.call_args[0]
        self.assertEqual(payload["queryParams"], "")

    def test_navigate_clear_query_params_empty_dict(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate(query_params={})

        _, payload = mock.call_args[0]
        self.assertEqual(payload["queryParams"], "")

    def test_navigate_clear_fragment(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate(fragment="")

        _, payload = mock.call_args[0]
        self.assertEqual(payload["fragment"], "")

    def test_navigate_replace_false(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate("/settings", replace=False)

        _, payload = mock.call_args[0]
        self.assertFalse(payload["replace"])

    def test_navigate_replace_true(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate("/settings", replace=True)

        _, payload = mock.call_args[0]
        self.assertTrue(payload["replace"])

    def test_navigate_no_args_raises(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            with self.assertRaises(ValueError):
                navigate()

    def test_navigate_empty_path_raises(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            with self.assertRaises(ValueError):
                navigate("")

    def test_navigate_leading_slash_optional(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate("dashboard")

        _, payload = mock.call_args[0]
        self.assertEqual(payload["path"], "/dashboard")

    def test_navigate_strip_leading_hash(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate(fragment="#section")

        _, payload = mock.call_args[0]
        self.assertEqual(payload["fragment"], "section")

    def test_navigate_strip_leading_question_mark(self):
        from deephaven.ui.hooks.use_navigate import use_navigate

        rc, ec, mock = self._setup_context_with_event()
        with rc.open(), ec.open():
            navigate = use_navigate()
            navigate(query_params="?foo=bar")

        _, payload = mock.call_args[0]
        self.assertEqual(payload["queryParams"], "?foo=bar")


# ────────────────────────────────────────────────────────────────────
# use_url_components
# ────────────────────────────────────────────────────────────────────


class UseUrlComponentsTestCase(BaseTestCase):
    """Tests for the use_url_components hook."""

    def test_returns_split_result(self):
        from deephaven.ui.hooks.use_url_components import use_url_components

        rc = make_render_context()
        rc.import_state(
            {
                "__url": "https://example.com:8080/app/-/page?q=1&tag=py#top",
            }
        )
        with rc.open():
            result = use_url_components()
            self.assertEqual(result.scheme, "https")
            self.assertEqual(result.netloc, "example.com:8080")
            self.assertEqual(result.path, "/app/-/page")
            self.assertEqual(result.query, "q=1&tag=py")
            self.assertEqual(result.fragment, "top")

    def test_returns_empty_for_no_url(self):
        from deephaven.ui.hooks.use_url_components import use_url_components

        rc = make_render_context()
        rc.import_state({})
        with rc.open():
            result = use_url_components()
            self.assertEqual(result.scheme, "")
            self.assertEqual(result.netloc, "")
            self.assertEqual(result.path, "")
            self.assertEqual(result.query, "")
            self.assertEqual(result.fragment, "")


# ────────────────────────────────────────────────────────────────────
# ui.route
# ────────────────────────────────────────────────────────────────────


class RouteTestCase(BaseTestCase):
    """Tests for the route() factory function."""

    def test_basic_route(self):
        from deephaven.ui.components.route import route

        def my_element():
            return None

        r = route(path="/users", element=my_element)
        self.assertEqual(r.path, "/users")
        self.assertEqual(r.element, my_element)
        self.assertIsNone(r.children)
        self.assertFalse(r.index)

    def test_index_route(self):
        from deephaven.ui.components.route import route

        def my_element():
            return None

        r = route(index=True, element=my_element)
        self.assertIsNone(r.path)
        self.assertTrue(r.index)

    def test_path_and_index_raises(self):
        from deephaven.ui.components.route import route

        with self.assertRaises(ValueError):
            route(path="/users", index=True)

    def test_nested_children(self):
        from deephaven.ui.components.route import route

        child = route(path="{user_id}")
        parent = route(child, path="users")
        self.assertEqual(len(parent.children), 1)
        self.assertEqual(parent.children[0].path, "{user_id}")


# ────────────────────────────────────────────────────────────────────
# ui.router — route compilation and matching
# ────────────────────────────────────────────────────────────────────


class RouterMatchingTestCase(BaseTestCase):
    """Tests for the router's internal route compilation and matching."""

    def test_compile_simple_routes(self):
        from deephaven.ui.components.route import _Route
        from deephaven.ui.components.router import _compile_routes

        def home():
            return None

        def about():
            return None

        routes = [
            _Route(path="home", element=home),
            _Route(path="about", element=about),
        ]
        compiled = _compile_routes(routes)
        patterns = [(c[0], c[1]) for c in compiled]
        self.assertIn(("home", home), patterns)
        self.assertIn(("about", about), patterns)

    def test_compile_nested_routes(self):
        from deephaven.ui.components.route import _Route
        from deephaven.ui.components.router import _compile_routes

        def user_profile():
            return None

        def user_post():
            return None

        routes = [
            _Route(
                path="users",
                children=[
                    _Route(
                        path="{user_id}",
                        element=user_profile,
                        children=[
                            _Route(path="posts/{post_id}", element=user_post),
                        ],
                    ),
                ],
            ),
        ]
        compiled = _compile_routes(routes)
        patterns = [c[0] for c in compiled]
        self.assertIn("users/{user_id}", patterns)
        self.assertIn("users/{user_id}/posts/{post_id}", patterns)

    def test_match_static_path(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def home():
            return None

        compiled = _compile_and_check([_Route(path="home", element=home)])
        result = _match_route("/home", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[0], home)
        self.assertEqual(result[1], {})

    def test_match_parameterized_path(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def user():
            return None

        compiled = _compile_and_check(
            [
                _Route(path="users/{user_id}", element=user),
            ]
        )
        result = _match_route("/users/42", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[0], user)
        self.assertEqual(result[1], {"user_id": "42"})

    def test_match_nested_params(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def user_post():
            return None

        compiled = _compile_and_check(
            [
                _Route(
                    path="users",
                    children=[
                        _Route(
                            path="{user_id}",
                            children=[
                                _Route(path="posts/{post_id}", element=user_post),
                            ],
                        ),
                    ],
                ),
            ]
        )
        result = _match_route("/users/42/posts/7", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[1], {"user_id": "42", "post_id": "7"})

    def test_static_preferred_over_param(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def settings():
            return "settings"

        def user():
            return "user"

        compiled = _compile_and_check(
            [
                _Route(path="users/settings", element=settings),
                _Route(path="users/{user_id}", element=user),
            ]
        )
        result = _match_route("/users/settings", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[0], settings)

    def test_wildcard_lowest_priority(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def home():
            return "home"

        def not_found():
            return "not_found"

        compiled = _compile_and_check(
            [
                _Route(path="home", element=home),
                _Route(path="*", element=not_found),
            ]
        )
        # /home should match home, not wildcard
        result = _match_route("/home", compiled)
        self.assertEqual(result[0], home)

        # /anything-else should match wildcard
        result = _match_route("/anything-else", compiled)
        self.assertEqual(result[0], not_found)
        self.assertEqual(result[1], {"*": "anything-else"})

    def test_wildcard_matches_deep_path(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def catch_all():
            return None

        compiled = _compile_and_check([_Route(path="*", element=catch_all)])
        result = _match_route("/a/b/c", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[1], {"*": "a/b/c"})

    def test_index_route_matches_parent_exact(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def index():
            return "index"

        def child():
            return "child"

        compiled = _compile_and_check(
            [
                _Route(
                    path="users",
                    children=[
                        _Route(index=True, element=index),
                        _Route(path="{user_id}", element=child),
                    ],
                ),
            ]
        )
        # /users should match the index route
        result = _match_route("/users", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[0], index)

    def test_optional_param(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def user_page():
            return None

        compiled = _compile_and_check(
            [
                _Route(path="users/{tab?}", element=user_page),
            ]
        )
        # With optional segment present
        result = _match_route("/users/settings", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[1], {"tab": "settings"})

        # With optional segment absent
        result = _match_route("/users", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[1], {})

    def test_no_match_returns_none(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def home():
            return None

        compiled = _compile_and_check([_Route(path="home", element=home)])
        result = _match_route("/nonexistent", compiled)
        self.assertIsNone(result)

    def test_root_path_match(self):
        from deephaven.ui.components.router import _compile_and_check, _match_route
        from deephaven.ui.components.route import _Route

        def dashboard():
            return None

        compiled = _compile_and_check(
            [
                _Route(index=True, element=dashboard),
            ]
        )
        result = _match_route("/", compiled)
        self.assertIsNotNone(result)
        self.assertEqual(result[0], dashboard)

    def test_conflict_detection(self):
        from deephaven.ui.components.router import _compile_routes, _check_conflicts
        from deephaven.ui.components.route import _Route

        def a():
            return None

        def b():
            return None

        compiled = _compile_routes(
            [
                _Route(path="home", element=a),
                _Route(path="home", element=b),
            ]
        )
        with self.assertRaises(ValueError):
            _check_conflicts(compiled)


# ────────────────────────────────────────────────────────────────────
# use_params
# ────────────────────────────────────────────────────────────────────


class UseParamsTestCase(BaseTestCase):
    """Tests for the use_params hook."""

    def test_returns_empty_dict_without_router(self):
        from deephaven.ui.hooks.use_params import use_params

        rc = make_render_context()
        rc.import_state({})
        with rc.open():
            result = use_params()
            self.assertEqual(result, {})
