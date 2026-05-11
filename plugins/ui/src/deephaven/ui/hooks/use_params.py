from __future__ import annotations

from ..hooks.use_context import use_context
from ..components.router import _route_params_context


def use_params() -> dict[str, str]:
    """
    Get the route parameters from the nearest ancestor router.

    Route parameters are defined by curly-braced segments in route paths.
    Returns:
        A dictionary mapping parameter names to their matched string values.
        Returns an empty dict if no router ancestor exists.
    """
    return use_context(_route_params_context)
