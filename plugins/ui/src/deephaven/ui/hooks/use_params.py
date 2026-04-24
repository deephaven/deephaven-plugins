from __future__ import annotations

from .use_context import use_context
from ..components.router import _route_params_context


def use_params() -> dict[str, str]:
    """
    Get the route parameters from the nearest ancestor router.

    Route parameters are defined by {var_name} segments in route paths
    and extracted when the route matches.

    Returns:
        A dictionary mapping parameter names to their matched string values.
        Returns an empty dict if no router ancestor exists.
    """
    return use_context(_route_params_context)
