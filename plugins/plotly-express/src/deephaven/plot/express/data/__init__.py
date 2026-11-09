"""
Deprecated: the sample datasets have moved to the ``deephaven-sample-data`` package.
Use :mod:`deephaven.sample_data` instead.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from . import data_generators
from ._deprecation import get_deprecated_attr, import_sample_data

if TYPE_CHECKING:
    # Unresolvable by pre-commit's pyright until deephaven-sample-data is published to PyPI
    from deephaven.sample_data import *  # pyright: ignore[reportMissingImports]


def __getattr__(name: str) -> Any:
    if name == "__all__":
        return [*import_sample_data().__all__, "data_generators"]
    if name.startswith("__"):
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    sample_data = import_sample_data()
    if name not in sample_data.__all__:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    return get_deprecated_attr(__name__, sample_data, name)


def __dir__() -> list[str]:
    return sorted(set(globals()) | set(import_sample_data().__all__))
