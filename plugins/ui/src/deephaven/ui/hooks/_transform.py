from __future__ import annotations

from typing import Any, Optional, TypeVar, overload

from deephaven.execution_context import get_exec_ctx
from deephaven.plugin_authorization import transform as _plugin_transform  # type: ignore[import-not-found]

T = TypeVar("T")


def _current_user_context() -> str:
    """
    Return a string describing the current user's authorization context, for use in error messages.

    Returns:
        A description of the current authorization context, or "unknown" if it cannot be determined.
    """
    try:
        return str(get_exec_ctx().j_exec_ctx.getAuthContext())
    except Exception:
        return "unknown"


@overload
def transform(obj: None) -> None:
    ...


@overload
def transform(obj: T) -> T:
    ...


def transform(obj: Optional[Any]) -> Optional[Any]:
    """
    Apply the server's authorization transform to ``obj`` for the current user's context.

    Unlike :func:`deephaven.plugin_authorization.transform`, this raises a clear error if the current user is not
    permitted to access a non-``None`` object, rather than silently returning ``None`` (which would otherwise surface
    later as a confusing ``AttributeError`` when the ``None`` result is used).

    Args:
        obj: The object to transform (typically a table). ``None`` is returned unchanged.

    Returns:
        The transformed object.

    Raises:
        PermissionError: if the current user is not permitted to access ``obj``.
    """
    if obj is None:
        return None
    result = _plugin_transform(obj)
    if result is None:
        raise PermissionError(
            f"The current user ({_current_user_context()}) is not permitted to access the requested object."
        )
    return result
