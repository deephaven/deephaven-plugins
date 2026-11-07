"""
Deprecated: the sample datasets have moved to the ``deephaven-sample-data`` package.
Use :mod:`deephaven.sample_data` instead.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from ._deprecation import get_deprecated_attr, import_sample_data

if TYPE_CHECKING:
    # Unresolvable by pre-commit's pyright until deephaven-sample-data is published to PyPI
    from deephaven.sample_data import *  # pyright: ignore[reportMissingImports]


def __getattr__(name: str) -> Any:
    if name.startswith("__"):
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    return get_deprecated_attr(
        __name__, import_sample_data("deephaven.sample_data._generators"), name
    )


def __dir__() -> list[str]:
    generators = import_sample_data("deephaven.sample_data._generators")
    return sorted(
        set(globals()) | {name for name in dir(generators) if not name.startswith("_")}
    )
