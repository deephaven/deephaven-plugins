"""
Deprecated: the example datasets have moved to the ``deephaven-sample-data`` package.
Use :mod:`deephaven.sample_data` instead; ``stocks`` is now ``deephaven.sample_data.stock_trades``.
"""

from __future__ import annotations

import importlib
import warnings
from types import ModuleType
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    # Unresolvable by pre-commit's pyright until deephaven-sample-data is published to PyPI
    from deephaven.sample_data import (  # pyright: ignore[reportMissingImports]
        ohlc,
        stock_trades as stocks,
        volume,
        yields,
        options_chain,
        values,
        large_prices,
    )

_SAMPLE_DATA_MODULE = "deephaven.sample_data"
# Module that defined these generators; private to deephaven-sample-data
_SOURCE_MODULE = "deephaven.sample_data._tradingview"

# Names this module exported before it was deprecated, mapped to their deephaven.sample_data name
_RENAMED = {
    "ohlc": "ohlc",
    "stocks": "stock_trades",
    "volume": "volume",
    "yields": "yields",
    "options_chain": "options_chain",
    "values": "values",
    "large_prices": "large_prices",
}


def _import(module_name: str) -> ModuleType:
    """
    Import a module from the deephaven-sample-data package.
    Imported lazily so tradingview_lightweight still imports if that package is missing.

    Args:
        module_name: The module to import

    Returns:
        The imported module
    """
    try:
        return importlib.import_module(module_name)
    except ImportError as e:
        raise ImportError(
            f"{__name__} requires the deephaven-sample-data package. "
            "Install it with `pip install deephaven-sample-data` and use deephaven.sample_data instead."
        ) from e


def _replacement(name: str, value: Any) -> str:
    """
    Get a migration hint pointing to a public location that exposes the attribute.

    Args:
        name: The name of the attribute
        value: The value of the attribute

    Returns:
        The migration hint
    """
    sample_data = _import(_SAMPLE_DATA_MODULE)
    if name in sample_data.__all__ and getattr(sample_data, name) is value:
        return f"Use {_SAMPLE_DATA_MODULE}.{name} from the deephaven-sample-data package instead."
    if isinstance(value, ModuleType):
        return f"Import {value.__name__} directly instead."
    # Instances like ints report a "builtins" __module__, so only trust it for callables and classes
    module = getattr(value, "__module__", None) if callable(value) else None
    if isinstance(module, str) and not module.startswith(_SAMPLE_DATA_MODULE):
        return f"Use {module}.{getattr(value, '__qualname__', name)} instead."
    return "It has no public replacement in the deephaven-sample-data package."


def __getattr__(name: str) -> Any:
    if name == "__all__":
        return list(_RENAMED)
    if name.startswith("__"):
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

    if name in _RENAMED:
        new_name = _RENAMED[name]
        value = getattr(_import(_SAMPLE_DATA_MODULE), new_name)
        hint = f"Use {_SAMPLE_DATA_MODULE}.{new_name} from the deephaven-sample-data package instead."
    else:
        source = _import(_SOURCE_MODULE)
        if not hasattr(source, name):
            raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
        value = getattr(source, name)
        hint = _replacement(name, value)

    warnings.warn(
        f"{__name__}.{name} is deprecated and will be removed in a future release. "
        + hint,
        DeprecationWarning,
        stacklevel=2,
    )
    return value


def __dir__() -> list[str]:
    return sorted(set(globals()) | set(_RENAMED))
