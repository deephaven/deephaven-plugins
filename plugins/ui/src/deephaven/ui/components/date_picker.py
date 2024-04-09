from __future__ import annotations

from typing import Any, Sequence, Callable
from deephaven.time import to_j_instant
from ..elements import Element, BaseElement
from .._internal.utils import (
    create_props,
    convert_date_props,
    prioritized_callable_date_converter,
)
from ..types import Date, Granularity

DatePickerElement = Element

# All the props that can be date types
_SIMPLE_DATE_PROPS = {
    "placeholder_value",
    "value",
    "default_value",
    "min_value",
    "max_value",
}
_LIST_DATE_PROPS = {"unavailable_values"}
_CALLABLE_DATE_PROPS = {"on_change"}

# The priority of the date props to determine the format of the date passed to the callable date props
_DATE_PROPS_PRIORITY = ["value", "default_value", "placeholder_value"]


def _convert_date_picker_props(
    props: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert date picker props to Java date types.

    Args:
        props: The props passed to the date picker.

    Returns:
        The converted props.
    """

    callable_date_converter = prioritized_callable_date_converter(
        props, _DATE_PROPS_PRIORITY, to_j_instant
    )

    convert_date_props(
        props,
        _SIMPLE_DATE_PROPS,
        _LIST_DATE_PROPS,
        _CALLABLE_DATE_PROPS,
        callable_date_converter,
    )

    return props


def date_picker(
    placeholder_value: Date | None = None,
    value: Date | None = None,
    default_value: Date | None = None,
    min_value: Date | None = None,
    max_value: Date | None = None,
    unavailable_values: Sequence[Date] | None = None,
    granularity: Granularity | None = None,
    on_change: Callable[[Date], None] | None = None,
    **props: Any,
) -> DatePickerElement:
    """


    Args:


    Returns:
    """
    _, props = create_props(locals())

    _convert_date_picker_props(props)

    return BaseElement("deephaven.ui.components.DatePicker", **props)
