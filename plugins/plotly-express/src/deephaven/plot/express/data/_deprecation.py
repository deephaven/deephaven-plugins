from __future__ import annotations

import importlib
import warnings
from types import ModuleType
from typing import Any


def import_sample_data(module_name: str = "deephaven.sample_data") -> ModuleType:
    """
    Import a module from the deephaven-sample-data package.
    Imported lazily so deephaven.plot.express still imports if that package is missing.

    Args:
        module_name: The module to import

    Returns:
        The imported module
    """
    try:
        return importlib.import_module(module_name)
    except ImportError as e:
        raise ImportError(
            "deephaven.plot.express.data requires the deephaven-sample-data package. "
            "Install it with `pip install deephaven-sample-data` and use deephaven.sample_data instead."
        ) from e


def get_deprecated_attr(module_name: str, source: ModuleType, name: str) -> Any:
    """
    Get an attribute from a deephaven.sample_data module, warning that the old location is deprecated.

    Args:
        module_name: The name of the deprecated module the attribute was accessed from
        source: The module to forward the attribute access to
        name: The name of the attribute

    Returns:
        The attribute from the source module

    Raises:
        AttributeError: If the attribute does not exist on the source module
    """
    if name.startswith("__") or not hasattr(source, name):
        raise AttributeError(f"module {module_name!r} has no attribute {name!r}")
    warnings.warn(
        f"{module_name}.{name} is deprecated and will be removed in a future release. "
        f"Use deephaven.sample_data.{name} from the deephaven-sample-data package instead.",
        DeprecationWarning,
        stacklevel=3,
    )
    return getattr(source, name)
