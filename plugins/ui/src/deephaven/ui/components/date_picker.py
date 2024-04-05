from __future__ import annotations

from typing import Any, Sequence, Callable

from deephaven.dtypes import Instant, ZonedDateTime, LocalDate
from deephaven.time import to_j_instant, to_j_zdt, to_j_local_date

from ..elements import Element
from .._internal.utils import create_props, wrap_callable
from ..types import Date, Granularity

DatePickerElement = Element


def convert_to_java_date(
    date: Date,
) -> Instant | ZonedDateTime | LocalDate:  # type: ignore
    """
    Convert a Date to a Java date type.
    In order of preference, tries to convert to Instant, ZonedDateTime, and LocalDate.
    If none of these work, raises a TypeError.

    Args:
        date: The date to convert to a Java date type.

    Returns:
        The Java date type.
    """
    try:
        return to_j_instant(date)
    except TypeError:
        # ignore, try next
        pass

    try:
        return to_j_zdt(date)
    except TypeError:
        # ignore, try next
        pass

    try:
        return to_j_local_date(date)
    except TypeError:
        raise TypeError(
            f"Could not convert {date} to one of Instant, ZonedDateTime, or LocalDate."
        )


def date_converter(
    props: dict[str, Any],
) -> Callable[[Date], Instant | ZonedDateTime | LocalDate]:  # type: ignore
    """
    Go through "value", "default_value", and "placeholder_value" in props to
    determine the type of date converter to use.
    If none of these are present, defaults to Instant.
    This is used to convert callback arguments to Java date types.

    Args:
        props: The props to check for date types.

    Returns:
        The date converter.
    """
    converters = {
        Instant: to_j_instant,
        ZonedDateTime: to_j_zdt,
        LocalDate: to_j_local_date,
    }

    if "value" in props:
        return converters[type(props["value"])]
    elif "default_value" in props:
        return converters[type(props["default_value"])]
    elif "placeholder_value" in props:
        return converters[type(props["placeholder_value"])]

    return to_j_instant


def wrap_date_callable(
    date_callable: Callable[[Date], None],
    converter: Callable[[Date], Any],
) -> Callable[[Date], None]:
    """
    Wrap a callable to convert the Date argument to a Java date type.
    This maintains the original callable signature so that the Date argument can be dropped.

    Args:
        date_callable: The callable to wrap.
        converter: The date converter to use.

    Returns:
        The wrapped callable.
    """
    return lambda date: wrap_callable(date_callable)(converter(date))


def convert_date_props(
    props: dict[str, Any],
    simple_date_props: set[str],
    list_date_props: set[str],
    callable_date_props: set[str],
    converter: Callable[[Date], Any],
) -> None:
    """
    Convert date props to Java date types in place.

    Args:
        props: The props passed to the component.
        simple_date_props: A set of simple date keys to convert. The prop value should be a single Date.
        list_date_props: A set of list date keys to convert. The prop value should be a list of Dates.
        callable_date_props: A set of callable date keys to convert.
            The prop value should be a callable that takes a Date.
        converter: The date converter to use.

    Returns:
        The converted props.
    """
    for key in simple_date_props:
        if key in props:
            props[key] = convert_to_java_date(props[key])

    for key in list_date_props:
        if key in props:
            if not isinstance(props[key], list):
                raise TypeError(f"{key} must be a list of Dates")
            props[key] = [convert_to_java_date(date) for date in props[key]]

    for key in callable_date_props:
        if key in props:
            if not callable(props[key]):
                raise TypeError(f"{key} must be a callable")
            props[key] = wrap_date_callable(props[key], converter)


def convert_date_picker_props(
    props: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert date picker props to Java date types.

    Args:
        props: The props passed to the date picker.

    Returns:
        The converted props.
    """
    simple_date_props = {
        "placeholder_value",
        "value",
        "default_value",
        "min_value",
        "max_value",
    }
    list_date_props = {"unavailable_values"}
    callable_date_props = {"on_change"}

    converter = date_converter(props)

    convert_date_props(
        props, simple_date_props, list_date_props, callable_date_props, converter
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
) -> DatePickerElement | None:
    """


    Args:


    Returns:
    """
    _, props = create_props(locals())

    convert_date_picker_props(props)

    print(props)

    return None  # BaseElement("deephaven.ui.components.DatePicker", **props)
