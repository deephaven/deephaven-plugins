from __future__ import annotations

from typing import Any, Optional, TypeVar, overload

from deephaven.execution_context import get_exec_ctx
from deephaven.plugin_authorization import transform as _plugin_transform  # type: ignore[import-not-found]
from ..object_types.ElementType import _DISABLE_AUTHORIZATION_EXPORT_TRANSFORM_PROPERTY

T = TypeVar("T")

"""
If we are disabling transforms, then we should not perform any transformation on the ingress to our hooks either.  This
may have the effect of allowing users to exfiltrate data; but is an escape hatch to avoid breaking existing dh.ui
queries that depend on old behavior.
"""
skip_transform: bool
try:
    # deephaven.configuration only exists in the 42.x server package; the import is conditional to
    # maintain compatibility with 41.x, where ImportError is caught and the transform is enforced.
    from deephaven.configuration import get_configuration  # type: ignore[import-untyped,import-not-found]

    skip_transform = get_configuration().get_bool(
        _DISABLE_AUTHORIZATION_EXPORT_TRANSFORM_PROPERTY, False
    )
except Exception:
    skip_transform = False


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
    if skip_transform:
        return obj
    if obj is None:
        return None
    result = _plugin_transform(obj)
    if result is None:
        raise PermissionError(
            f"The current user ({_current_user_context()}) is not permitted to access the requested object."
        )
    return result
