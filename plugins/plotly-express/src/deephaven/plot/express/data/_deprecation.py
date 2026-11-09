from __future__ import annotations

import importlib
import warnings
from types import ModuleType
from typing import Any

SAMPLE_DATA_MODULE = "deephaven.sample_data"


def import_sample_data(module_name: str = SAMPLE_DATA_MODULE) -> ModuleType:
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


def public_names(module: ModuleType) -> list[str]:
    """
    Get the names a wildcard import of the module would have provided before it was deprecated.

    Args:
        module: The module to get the public names of

    Returns:
        The public names of the module
    """
    names = getattr(module, "__all__", None)
    if names is not None:
        return list(names)
    return [name for name in dir(module) if not name.startswith("_")]


def _replacement(name: str, value: Any) -> str:
    """
    Get a migration hint pointing to a public location that exposes the attribute.

    Args:
        name: The name of the attribute
        value: The value of the attribute

    Returns:
        The migration hint
    """
    sample_data = import_sample_data()
    if name in sample_data.__all__ and getattr(sample_data, name) is value:
        return f"Use {SAMPLE_DATA_MODULE}.{name} from the deephaven-sample-data package instead."
    if isinstance(value, ModuleType):
        return f"Import {value.__name__} directly instead."
    # Instances like ints report a "builtins" __module__, so only trust it for callables and classes
    module = getattr(value, "__module__", None) if callable(value) else None
    if isinstance(module, str) and not module.startswith(SAMPLE_DATA_MODULE):
        return f"Use {module}.{getattr(value, '__qualname__', name)} instead."
    return "It has no public replacement in the deephaven-sample-data package."


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
    value = getattr(source, name)
    warnings.warn(
        f"{module_name}.{name} is deprecated and will be removed in a future release. "
        + _replacement(name, value),
        DeprecationWarning,
        stacklevel=3,
    )
    return value
