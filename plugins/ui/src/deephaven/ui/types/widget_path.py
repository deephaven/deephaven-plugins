from __future__ import annotations

import re

from deephaven.plugin.utilities import is_enterprise_environment

from dataclasses import dataclass
from typing import TypedDict, Union

from ..types import QueryParams

# Patterns for embed context detection
_EMBED_RE = re.compile(r"/(?:embed|iframe)/")
_NON_EMBED_DASHBOARD_RE = re.compile(r"(?<!/embed)/dashboard/")


@dataclass(frozen=True)
class WidgetPath:
    """
    Resolves to a widget URL path at render time.

    When used as a route ``path``, the router resolves this into an absolute
    URL path using the current URL context (base URL).

    Args:
        widget: The widget name.
        embed: Whether to use the embed route (True) or the app route (False).
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
    URL path using the current URL context (base URL).
    Unlike WidgetPath, this requires an explicit query name or serial number.

    Args:
        widget: The widget name. Required unless ``dashboard`` is a string.
        query: The persistent query name (str) or serial number (int).
        embed: Whether to use the embed route (True) or the app/dashboard route (False).
               If None (default), auto-detects from the current URL.
        local: Optional sub-path appended after "/local/" for
               user-defined routing within the target widget.
        replica_slot: Optional replica slot number for the widget route.
        dashboard: Controls dashboard route variant. When True, the embed route
               uses ``iriside/embed/dashboard/{serial}-{widget}`` instead of the
               widget route. When a string, that string is substituted directly
               as the dashboard name segment. When None (default), the existing
               widget/dashboard logic based on ``embed`` is used.
    """

    query: str | int
    widget: str | None = None
    embed: bool | None = None
    local: str | None = None
    replica_slot: int | None = None
    dashboard: bool | str | None = None

    def __post_init__(self) -> None:
        if self.widget is None and not isinstance(self.dashboard, str):
            raise ValueError(
                "EnterpriseWidgetPath.widget is required unless dashboard is a string"
            )


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


try:
    # Import SessionManager for enterprise widget path resolution.
    from deephaven_enterprise.client.session_manager import (  # pyright: ignore[reportMissingImports]
        SessionManager,
    )
except ImportError:
    pass


def _detect_embed(current_url_path: str) -> bool:
    """
    Detect whether the current URL represents an embed context.

    Returns True if the URL contains ``/embed/`` or ``/iframe/``.
    Returns False if it contains ``/dashboard/`` without an embed prefix.
    Defaults to True (embed) if neither pattern is found.
    """
    if _EMBED_RE.search(current_url_path):
        return True
    if _NON_EMBED_DASHBOARD_RE.search(current_url_path):
        return False
    return True  # Default to embed


def _get_serial_for_name(name: str) -> int:
    if not is_enterprise_environment():
        raise RuntimeError(
            "deephaven_enterprise is required for embed to dashboard path conversion"
        )
    sm = SessionManager()  # pyright: ignore[reportUnboundVariable]
    return sm.controller_client.get_serial_for_name(name=name)


def _resolve_serial_widget(widget_path: EnterpriseWidgetPath) -> str:
    """
    Build the ``{serial}-{widget}`` dashboard name segment.

    If ``query`` is a string name, the serial is resolved via
    ``SessionManager``. If it is already an int, it is used directly.

    Raises:
        ValueError: If ``widget`` is None.
    """
    if widget_path.widget is None:
        raise ValueError(
            "EnterpriseWidgetPath.widget is required when dashboard is not a string"
        )
    query = widget_path.query
    if isinstance(query, str):
        serial = _get_serial_for_name(query)
    else:
        serial = query
    return f"{serial}-{widget_path.widget}"


def resolve_widget_path(
    widget_path: WidgetPath | EnterpriseWidgetPath,
    current_url_path: str,
    base_url: str = "/",
) -> str:
    """
    Resolve a WidgetPath or EnterpriseWidgetPath to an absolute URL path string.

    Args:
        widget_path: The widget path descriptor.
        current_url_path: The current absolute URL path, used for embed
                          auto-detection when ``embed`` is None.
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
    dashboard = widget_path.dashboard

    if dashboard is not None:
        # Dashboard route variant
        if isinstance(dashboard, str):
            dashboard_name = dashboard
        else:
            # dashboard=True — build {serial}-{widget}
            dashboard_name = _resolve_serial_widget(widget_path)

        if embed:
            path = f"{base}/iriside/embed/dashboard/{dashboard_name}{local_suffix}"
        else:
            path = f"{base}/iriside/dashboard/{dashboard_name}{local_suffix}"
    elif embed:
        # Standard embed widget route
        query_part = widget_path.query
        replica = (
            f"/{widget_path.replica_slot}"
            if widget_path.replica_slot is not None
            else ""
        )
        path = f"{base}/iriside/embed/widget/{query_part}/{widget_path.widget}{replica}{local_suffix}"
    else:
        # Standard non-embed dashboard route
        dashboard_name = _resolve_serial_widget(widget_path)
        path = f"{base}/iriside/dashboard/{dashboard_name}{local_suffix}"

    return path
