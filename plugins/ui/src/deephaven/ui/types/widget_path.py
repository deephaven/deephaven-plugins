from __future__ import annotations

from deephaven.plugin.utilities import is_enterprise_environment

import re
from dataclasses import dataclass
from typing import TypedDict, Union

from ..types import QueryParams


@dataclass(frozen=True)
class WidgetPath:
    """
    Resolves to a widget URL path at render time.

    When used as a route ``path``, the router resolves this into an absolute
    URL path using the current URL context (base URL, embed/app detection).

    Args:
        widget: The widget name.
        embed: Whether to use the embed route or the app route.
               If None (default), auto-detects from the current URL.
        local: Optional sub-path appended after "/local/" for
               user-defined routing within the target widget.
    """

    widget: str
    embed: bool | None = None
    local: str | None = None


@dataclass(frozen=True)
class EnterpriseWidgetPath:
    """
    Resolves to a widget URL path at render time for enterprise environments.

    When used as a route ``path``, the router resolves this into an absolute
    URL path using the current URL context (base URL, embed/app detection).
    Unlike WidgetPath, this requires an explicit query name or serial number.

    Args:
        widget: The widget name.
        query: The persistent query name (str) or serial number (int).
        embed: Whether to use the embed route or the app route.
               If None (default), auto-detects from the current URL.
        local: Optional sub-path appended after "/local/" for
               user-defined routing within the target widget.
        replica_slot: Optional replica slot number for the widget route.
    """

    widget: str
    query: str | int
    embed: bool | None = None
    local: str | None = None
    replica_slot: int | None = None


RoutePath = Union[str, WidgetPath, EnterpriseWidgetPath]
"""
Valid types for route ``path`` arguments.
"""


class NavigationTarget(TypedDict, total=False):
    """
    A TypedDict used by ``ui.link``'s ``to`` prop for explicit control
    over navigation.
    """

    path: RoutePath
    query_params: Union[str, QueryParams]
    fragment: str
    absolute: bool
    replace: bool


# Patterns for detecting embed/app/iframe routes in a URL path.
_EMBED_WIDGET_RE = re.compile(r"/embed/widget/")
_DASHBOARD_RE = re.compile(r"/dashboard/")
_IFRAME_WIDGET_RE = re.compile(r"/iframe/widget/")

try:
    # Import SessionManager for enterprise widget path resolution.
    from deephaven_enterprise.client.session_manager import (  # pyright: ignore[reportMissingImports]
        SessionManager,
    )
except ImportError:
    pass


def _get_serial_for_name(name: str) -> int:
    if not is_enterprise_environment():
        raise RuntimeError(
            "deephaven_enterprise is required for embed to dashboard path conversion"
        )
    sm = SessionManager()  # pyright: ignore[reportUnboundVariable]
    return sm.controller_client.get_serial_for_name(name=name)


def _detect_embed(current_url_path: str) -> bool:
    """
    Detect whether the current URL is an embed/iframe route (True) or
    an app route (False). Defaults to True if neither pattern is found.
    """
    if _EMBED_WIDGET_RE.search(current_url_path) or _IFRAME_WIDGET_RE.search(
        current_url_path
    ):
        return True
    if _DASHBOARD_RE.search(current_url_path):
        return False
    return True


def resolve_widget_path(
    widget_path: WidgetPath | EnterpriseWidgetPath,
    current_url_path: str,
    base_url: str = "/",
) -> str:
    """
    Resolve a WidgetPath or EnterpriseWidgetPath to an absolute URL path string.

    Args:
        widget_path: The widget path descriptor.
        current_url_path: The current absolute URL path from the browser.
        base_url: The base URL from the frontend (import.meta.env.BASE_URL).
                  Defaults to "/".

    Returns:
        The resolved absolute URL path string.
    """
    # Normalize base_url: ensure no trailing slash for clean concatenation
    base = base_url.rstrip("/")

    embed = widget_path.embed
    if embed is None:
        embed = _detect_embed(current_url_path)

    local_suffix = ""
    if widget_path.local is not None:
        local_path = widget_path.local.lstrip("/")
        local_suffix = f"/local/{local_path}"

    if isinstance(widget_path, WidgetPath):
        if embed:
            path = f"{base}/iframe/widget/{widget_path.widget}{local_suffix}"
        else:
            path = f"{base}{local_suffix}" if local_suffix else (base or "/")
        return path

    # EnterpriseWidgetPath
    if embed:
        # Enterprise embed route: <base>/embed/widget/<query>/<widget>[/<replica_slot>][/local/...]
        query_part = widget_path.query
        replica = (
            f"/{widget_path.replica_slot}"
            if widget_path.replica_slot is not None
            else ""
        )
        path = f"{base}/embed/widget/{query_part}/{widget_path.widget}{replica}{local_suffix}"
    else:
        # Enterprise app route: <base>/dashboard/<serial>_<widget>[/local/...]
        query = widget_path.query
        if isinstance(query, str):
            serial = _get_serial_for_name(query)
        else:
            serial = query
        path = f"{base}/dashboard/{serial}_{widget_path.widget}{local_suffix}"

    return path
