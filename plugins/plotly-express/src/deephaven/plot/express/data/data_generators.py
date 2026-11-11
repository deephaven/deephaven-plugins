"""
Deprecated: the sample datasets have moved to the ``deephaven-sample-data`` package.
Use :mod:`deephaven.sample_data` instead.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ._deprecation import get_deprecated_attr, import_sample_data, public_names

if TYPE_CHECKING:
    # Unresolvable by pre-commit's pyright until deephaven-sample-data is published to PyPI
    from deephaven.sample_data import *  # pyright: ignore[reportMissingImports]

_GENERATORS_MODULE = "deephaven.sample_data._generators"


def __getattr__(name: str) -> Any:
    if name == "__all__":
        return public_names(import_sample_data(_GENERATORS_MODULE))
    if name.startswith("__"):
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    return get_deprecated_attr(__name__, import_sample_data(_GENERATORS_MODULE), name)


def __dir__() -> list[str]:
    return sorted(
        set(globals()) | set(public_names(import_sample_data(_GENERATORS_MODULE)))
    )
