from __future__ import annotations

from typing import Any, Callable, Dict, List, Set, Tuple, cast, Sequence, TypeVar, Union
from deephaven.dtypes import (
    Instant as DTypeInstant,
    ZonedDateTime as DTypeZonedDateTime,
    LocalDate as DTypeLocalDate,
)
from inspect import signature
import sys
from functools import partial
from deephaven.time import (
    to_j_instant,
    to_j_zdt,
    to_j_local_date,
    to_j_local_time,
    dh_now,
    dh_today,
)

from ..types import (
    Date,
    JavaDate,
    DateRange,
    Time,
    JavaTime,
    LocalDateConvertible,
    LocalDate,
    Instant,
    Undefined,
)

T = TypeVar("T")

_UNSAFE_PREFIX = "UNSAFE_"
_ARIA_PREFIX = "aria_"
_ARIA_PREFIX_REPLACEMENT = "aria-"

_DATE_CONVERTERS = {
    "java.time.Instant": to_j_instant,
    "java.time.ZonedDateTime": to_j_zdt,
    "java.time.LocalDate": to_j_local_date,
}

_TIME_CONVERTERS = {
    "java.time.ZonedDateTime": to_j_zdt,
    "java.time.Instant": to_j_instant,
    "java.time.LocalTime": to_j_local_time,
}


def is_nullish(value: Any) -> bool:
    """
    Check if a value is nullish (`None` or `Undefined`).

    Args:
        value: The value to check.

    Returns:
        Checks if the value is nullish.
    """
    return value is None or value is Undefined


def get_component_name(component: Any) -> str:
    """
    Get the name of the component

    Args:
        component: The component to get the name of.

    Returns:
        The name of the component.
    """
    try:
        return component.__module__ + "." + component.__name__
    except Exception:
        return component.__class__.__module__ + "." + component.__class__.__name__


def get_component_qualname(component: Any) -> str:
    """
    Get the name of the component

    Args:
        component: The component to get the name of.

    Returns:
        The name of the component.
    """
    try:
        return component.__module__ + "." + component.__qualname__
    except Exception:
        return component.__class__.__module__ + "." + component.__class__.__qualname__


def to_camel_case(snake_case_text: str) -> str:
    """
    Convert a snake_case string to camelCase.
    Preserves any leading or trailing underscores.

    Args:
        snake_case_text: The snake_case string to convert.

    Returns:
        The camelCase string.
    """
    leading_underscores = len(snake_case_text) - len(snake_case_text.lstrip("_"))
    trailing_underscores = len(snake_case_text) - len(snake_case_text.rstrip("_"))
    components = snake_case_text.strip("_").split("_")
    camel_case_text = components[0] + "".join(
        (x[0].upper() + x[1:]) for x in components[1:]
    )
    return "_" * leading_underscores + camel_case_text + "_" * trailing_underscores


def to_react_prop_case(snake_case_text: str) -> str:
    """
    Convert a snake_case string to camelCase, with exceptions for special props like `UNSAFE_` or `aria_` props.

    Args:
        snake_case_text: The snake_case string to convert.

    Returns:
        The camelCase string with the `UNSAFE_` prefix intact if present, or `aria_` converted to `aria-`.
    """
    if snake_case_text.startswith(_UNSAFE_PREFIX):
        return _UNSAFE_PREFIX + to_camel_case(snake_case_text[len(_UNSAFE_PREFIX) :])
    if snake_case_text.startswith(_ARIA_PREFIX):
        return _ARIA_PREFIX_REPLACEMENT + to_camel_case(
            snake_case_text[len(_ARIA_PREFIX) :]
        )
    return to_camel_case(snake_case_text)


def convert_dict_keys(
    dict: dict[str, Any], convert_key: Callable[[str], str]
) -> dict[str, Any]:
    """
    Convert the keys of a dict using a function.

    Args:
        dict: The dict to convert the keys of.
        convert_key: The function to convert the keys.

    Returns:
        The dict with the converted keys.
    """
    return {convert_key(k): v for k, v in dict.items()}


def dict_to_camel_case(
    dict: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert a dict to a dict with camelCase keys.

    Args:
        dict: The dict to convert.

    Returns:
        The camelCase dict.
    """
    return convert_dict_keys(dict, to_camel_case)


def dict_to_react_props(
    dict: dict[str, Any], _nullable_props: list[str] = []
) -> dict[str, Any]:
    """
    Convert a dict to React-style prop names ready for the web.
    Converts snake_case to camelCase with the exception of special props like `UNSAFE_` or `aria_` props.
    Removes empty keys.

    Args:
        dict: The dict to convert.

    Returns:
        The React props dict.
    """
    return convert_dict_keys(
        remove_empty_keys(dict, _nullable_props), to_react_prop_case
    )


def remove_empty_keys(
    dict: dict[str, Any], _nullable_props: list[str] = []
) -> dict[str, Any]:
    """
    Remove keys from a dict that have a value of None, or Undefined if in _nullable_props.

    Args:
        dict: The dict to remove keys from.
        _nullable_props: A list of props that get removed if they are Undefined (instead of None).

    Returns:
        The dict with keys removed.
    """
    cleaned = {}
    for k, v in dict.items():
        if k in _nullable_props:
            if v is not Undefined:
                cleaned[k] = v
        else:
            if v is Undefined:
                raise ValueError("UndefinedType found in a non-nullable prop.")
            elif v is not None:
                cleaned[k] = v

    return cleaned


def _wrapped_callable(
    max_args: int | None,
    kwargs_set: set[str] | None,
    func: Callable,
    *args: Any,
    **kwargs: Any,
) -> Any:
    """
    Filter the args and kwargs and call the specified function with the filtered args and kwargs.

    Args:
        max_args: The maximum number of positional arguments to pass to the function.
          If None, all args are passed.
        kwargs_set: The set of keyword arguments to pass to the function.
          If None, all kwargs are passed.
        func: The function to call
        *args: args, used by the dispatcher
        **kwargs: kwargs, used by the dispatcher

    Returns:
        The result of the function call.
    """
    args = args if max_args is None else args[:max_args]
    kwargs = (
        kwargs
        if kwargs_set is None
        else {k: v for k, v in kwargs.items() if k in kwargs_set}
    )
    return func(*args, **kwargs)


def wrap_callable(func: Callable) -> Callable:
    """
    Wrap the function so args are dropped if they are not in the signature.

    Args:
        func: The callable to wrap

    Returns:
        The wrapped callable
    """
    try:
        if sys.version_info.major == 3 and sys.version_info.minor >= 10:
            sig = signature(func, eval_str=True)  # type: ignore
        else:
            sig = signature(func)

        max_args: int | None = 0
        kwargs_set: Set | None = set()

        for param in sig.parameters.values():
            if param.kind == param.POSITIONAL_ONLY:
                max_args = cast(int, max_args)
                max_args += 1
            elif param.kind == param.POSITIONAL_OR_KEYWORD:
                # Don't know until runtime whether this will be passed as a positional or keyword arg
                max_args = cast(int, max_args)
                kwargs_set = cast(Set, kwargs_set)
                max_args += 1
                kwargs_set.add(param.name)
            elif param.kind == param.VAR_POSITIONAL:
                max_args = None
            elif param.kind == param.KEYWORD_ONLY:
                kwargs_set = cast(Set, kwargs_set)
                kwargs_set.add(param.name)
            elif param.kind == param.VAR_KEYWORD:
                kwargs_set = None

        return partial(_wrapped_callable, max_args, kwargs_set, func)
    except ValueError or TypeError:
        # This function has no signature, so we can't wrap it
        # Return the original function should be okay
        return func


def create_props(args: dict[str, Any]) -> tuple[tuple[Any, ...], dict[str, Any]]:
    """
    Create props from the args. Combines the named props with the kwargs props.

    Args:
        args: A dictionary of arguments, from locals()

    Returns:
        A tuple of children and props
    """
    children, props = args.pop("children", tuple()), args.pop("props", {})
    props.update(args)
    return children, props


def convert_to_java_date(
    date: Date,
) -> JavaDate:
    """
    Convert a Date to a Java date type.
    In order of preference, tries to convert to Instant, ZonedDateTime, and LocalDate.
    If none of these work, raises a TypeError.

    Args:
        date: The date to convert to a Java date type.

    Returns:
        The Java date type.
    """
    # For strings, parseInstant and parseZonedDateTime both succeed for the same strings
    # Try parsing as a ZonedDateTime first per the documentation
    if isinstance(date, str):
        try:
            return to_j_zdt(date)  # type: ignore
        except Exception:
            # ignore, try next
            pass

    try:
        return to_j_instant(date)  # type: ignore
    except Exception:
        # ignore, try next
        pass

    try:
        return to_j_zdt(date)  # type: ignore
    except Exception:
        # ignore, try next
        pass

    try:
        return to_j_local_date(date)  # type: ignore
    except Exception:
        raise TypeError(
            f"Could not convert {date} to one of Instant, ZonedDateTime, or LocalDate."
        )


def _convert_to_java_time(
    time: Time,
) -> JavaTime:
    """
    Convert a Time to a Java time type.
    In order of preference, tries to convert to LocalTime, Instant, ZonedDateTime.
    If none of these work, raises a TypeError.

    Args:
        time: The time to convert to a Java time type.

    Returns:
        The Java time type.
    """
    try:
        return to_j_local_time(time)  # type: ignore
    except Exception:
        # ignore, try next
        pass

    # For strings, parseInstant and parseZonedDateTime both succeed for the same strings
    # Try parsing as a ZonedDateTime first per the documentation
    if isinstance(time, str):
        try:
            return to_j_zdt(time)  # type: ignore
        except Exception:
            # ignore, try next
            pass

    try:
        return to_j_instant(time)  # type: ignore
    except Exception:
        # ignore, try next
        pass

    try:
        return to_j_zdt(time)  # type: ignore
    except Exception:
        raise TypeError(
            f"Could not convert {time} to one of LocalTime, Instant, or ZonedDateTime."
        )


def get_jclass_name(value: Any) -> str:
    """
    Get the name of the Java class of the value.

    Args:
        value: The value to get the Java class name of.

    Returns:
        The name of the Java class of the value.
    """
    return str(value.jclass)[6:]


def _jclass_date_converter(
    value: JavaDate,
) -> Callable[[Date], Any]:
    """
    Get the converter for the Java date type.

    Args:
        value: The Java date type to get the converter for.

    Returns:
        The converter for the Java date type.
    """
    return _DATE_CONVERTERS[get_jclass_name(value)]


def _jclass_time_converter(
    value: JavaTime,
) -> Callable[[Time], Any]:
    """
    Get the converter for the Java time type.

    Args:
        value: The Java time type to get the converter for.

    Returns:
        The converter for the Java time type.
    """
    return _TIME_CONVERTERS[get_jclass_name(value)]


def _no_error_wrapped_callable(
    func: Callable[[T], None],
    converter: Callable[[T], Any],
) -> Callable[[T], None]:
    """
    Wrap the function so that it does not raise an error when called.

    Args:
        func: The callable to wrap
        converter: The converter to use

    Returns:
        The wrapped callable
    """

    def no_error_func(arg: T) -> None:
        wrapped_callable = wrap_callable(func)
        try:
            return wrapped_callable(converter(arg))
        except Exception:
            pass

    return no_error_func


def _wrap_date_callable(
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
    # When the user is typing a date, they may enter a value that does not parse
    # This will skip those errors rather than printing them to the screen
    return _no_error_wrapped_callable(date_callable, converter)


def wrap_local_date_callable(
    date_callable: Callable[[LocalDateConvertible], None],
) -> Callable[[LocalDate], None]:
    """
    Wrap a callable to convert the Date argument to a Java date type.
    This maintains the original callable signature so that the Date argument can be dropped.

    Args:
        date_callable: The callable to wrap.

    Returns:
        The wrapped callable.
    """
    # When the user is typing a date, they may enter a value that does not parse
    # This will skip those errors rather than printing them to the screen
    return _no_error_wrapped_callable(date_callable, to_j_local_date)


def _wrap_time_callable(
    time_callable: Callable[[Time], None],
    converter: Callable[[Time], Any],
) -> Callable[[Time], None]:
    """
    Wrap a callable to convert the Time argument to a Java time type.
    This maintains the original callable signature so that the Time argument can be dropped.

    Args:
        time_callable: The callable to wrap.
        converter: The time converter to use.

    Returns:
        The wrapped callable.
    """
    # When the user is typing a time, they may enter a value that does not parse
    # This will skip those errors rather than printing them to the screen
    return _no_error_wrapped_callable(time_callable, converter)


def _get_first_set_key(props: dict[str, Any], sequence: Sequence[str]) -> str | None:
    """
    Of the keys in sequence, get the first key that has a non-None value in props.
    If none of the keys have a non-None value, return None.

    Args:
        props: The props to check for non-None values.
        sequence: The sequence to check.

    Returns:
        The first non-nullish prop, or None if all props are None.
    """
    for key in sequence:
        if not is_nullish(props.get(key)):
            return key
    return None


def _date_or_range(value: JavaDate | DateRange) -> Any:
    """
    Gets the Java Date from a Java Date or DateRange.

    Args:
        value: the Java Date or DateRange

    Returns:
        The Java Date.
    """
    if isinstance(value, dict):
        return value["start"]
    return value


def _prioritized_date_callable_converter(
    props: dict[str, Any],
    priority: Sequence[str],
    default_converter: Callable[[Date], Any],
) -> Callable[[Date], Any]:
    """
    Get a callable date converter based on the type of the first non-None prop set.
    Checks the props in the order provided by the `priority` sequence.
    All the props in `priority` should be Java date types already.
    We do this so conversion so that the type returned on callbacks matches the type passed in by the user.
    If none of the props in `priority` are present, returns the default converter.

    Args:
        props: The props passed to the component.
        priority: The priority of the props to check.
        default_converter: The default converter to use if none of the priority props are present.

    Returns:
        The callable date converter.
    """

    first_set_key = _get_first_set_key(props, priority)
    # type ignore because pyright is not recognizing the nullish check
    return (
        _jclass_date_converter(
            _date_or_range(
                props[first_set_key]  # pyright: ignore[reportGeneralTypeIssues]
            )
        )
        if not is_nullish(first_set_key)
        else default_converter
    )


def _prioritized_time_callable_converter(
    props: dict[str, Any],
    priority: Sequence[str],
    default_converter: Callable[[Time], Any],
) -> Callable[[Time], Any]:
    """
    Get a callable time converter based on the type of the first non-None prop set.
    Checks the props in the order provided by the `priority` sequence.
    All the props in `priority` should be Java time types already.
    We do this so conversion so that the type returned on callbacks matches the type passed in by the user.
    If none of the props in `priority` are present, returns the default converter.

    Args:
        props: The props passed to the component.
        priority: The priority of the props to check.
        default_converter: The default converter to use if none of the priority props are present.

    Returns:
        The callable time converter.
    """

    first_set_key = _get_first_set_key(props, priority)
    # type ignore because pyright is not recognizing the nullish check
    return (
        _jclass_time_converter(
            props[first_set_key]  # pyright: ignore[reportGeneralTypeIssues]
        )
        if not is_nullish(first_set_key)
        else default_converter
    )


def convert_list_prop(
    key: str,
    value: list[Date] | None,
) -> list[str] | None:
    """
    Convert a list of Dates to Java date types.

    Args:
        key: The key of the prop.
        value: A list of Dates to convert to Java date types.

    Returns:
        The list of Java date types.
    """
    if value is None:
        return None

    if not isinstance(value, list):
        raise TypeError(f"{key} must be a list of Dates")
    return [str(convert_to_java_date(date)) for date in value]


def convert_date_range(
    date_range: DateRange,
    converter: Callable[[Date], Any],
) -> DateRange:
    """
    Convert a DateRange to Java date types.

    Args:
        date_range: The DateRange to convert to Java date types.
        converter: The date converter to use.

    Returns:
        The Java date types.
    """
    return DateRange(
        start=converter(date_range["start"]),
        end=converter(date_range["end"]),
    )


def _wrap_date_range_callable(
    date_callable: Callable[[DateRange], None],
    converter: Callable[[Date], Any],
) -> Callable[[DateRange], None]:
    """
    Wrap a callable to convert the Date argument to a Java date type.
    This maintains the original callable signature so that the Date argument can be dropped.

    Args:
        date_callable: The callable to wrap.
        converter: The date converter to use.

    Returns:
        The wrapped callable.
    """
    # When the user is typing a date, they may enter a value that does not parse
    # This will skip those errors rather than printing them to the screen
    return _no_error_wrapped_callable(date_callable, _date_range_converter(converter))


def _date_range_converter(
    converter: Callable[[Date], Any],
) -> Callable[[DateRange], DateRange]:
    """
    Get a converter for a DateRange.

    Args:
        converter: The converter to use for the start and end dates.

    Returns:
        The converter for the DateRange.
    """

    def date_range_converter(date_range: DateRange) -> DateRange:
        return convert_date_range(date_range, converter)

    return date_range_converter


def get_placeholder_value(
    placeholder_value: Date | None,
    granularity: str | None,
) -> Date:
    """
    Get the placeholder value for date components taking into account granularity.

    Args:
        placeholder_value: The current placeholder value, may be None.
        granularity: The granularity of the date component.
    Returns:
        The placeholder value to use.
    """
    # The user set the placeholder value, so use that
    if placeholder_value is not None:
        return placeholder_value
    # Use a local date if the granularity is day
    if isinstance(granularity, str) and granularity.upper() == "DAY":
        return to_j_local_date(dh_today())
    return dh_now()


def convert_date_props(
    props: dict[str, Any],
    simple_date_props: set[str],
    date_range_props: set[str],
    callable_date_props: set[str],
    priority: Sequence[str],
    granularity_key: str | None = None,
    default_converter: Callable[[Date], Any] = to_j_instant,
) -> None:
    """
    Convert date props to Java date types in place.

    Args:
        props: The props passed to the component.
        simple_date_props: A set of simple date keys to convert. The prop value should be a single Date.
        date_range_props: A set of date range keys to convert.
        callable_date_props: A set of callable date keys to convert.
            The prop value should be a callable that takes a Date.
        priority: The priority of the props to check.
        granularity_key: The key for the granularity
        default_converter: The default converter to use if none of the priority props are present.

    Returns:
        The converted props.
    """
    for key in simple_date_props:
        if not is_nullish(props.get(key)):
            props[key] = convert_to_java_date(props[key])

    for key in date_range_props:
        if not is_nullish(props.get(key)):
            props[key] = convert_date_range(props[key], convert_to_java_date)

    # the simple props must be converted before this to simplify the callable conversion
    converter = _prioritized_date_callable_converter(props, priority, default_converter)

    # based on the convert set the granularity if it is not set
    # Local Dates will default to DAY but we need to default to SECOND for the other types
    if (
        granularity_key is not None
        and is_nullish(props.get(granularity_key))
        and converter != to_j_local_date
    ):
        props[granularity_key] = "SECOND"

    # now that the converter is set, we can convert simple props to strings
    for key in simple_date_props:
        if not is_nullish(props.get(key)):
            props[key] = str(props[key])

    # and convert the date range props to strings
    for key in date_range_props:
        if not is_nullish(props.get(key)):
            props[key] = convert_date_range(props[key], str)

    # wrap the date callable with the convert
    # if there are date range props, we need to convert as a date range
    for key in callable_date_props:
        if not is_nullish(props.get(key)):
            if not callable(props[key]):
                raise TypeError(f"{key} must be a callable")
            if len(date_range_props) > 0:
                props[key] = _wrap_date_range_callable(props[key], converter)
            else:
                props[key] = _wrap_date_callable(props[key], converter)


def convert_time_props(
    props: dict[str, Any],
    simple_time_props: set[str],
    callable_time_props: set[str],
    priority: Sequence[str],
    default_converter: Callable[[Time], Any] = to_j_local_time,
) -> None:
    """
    Convert time props to Java time types in place.

    Args:
        props: The props passed to the component.
        simple_time_props: A set of simple time keys to convert. The prop value should be a single Time.
        callable_time_props: A set of callable time keys to convert.
            The prop value should be a callable that takes a Time.
        priority: The priority of the props to check.
        granularity_key: The key for the granularity
        default_converter: The default converter to use if none of the priority props are present.

    Returns:
        The converted props.
    """
    for key in simple_time_props:
        if not is_nullish(props.get(key)):
            props[key] = _convert_to_java_time(props[key])

    # the simple props must be converted before this to simplify the callable conversion
    converter = _prioritized_time_callable_converter(props, priority, default_converter)

    # now that the converter is set, we can convert simple props to strings
    for key in simple_time_props:
        if not is_nullish(props.get(key)):
            props[key] = str(props[key])

    # wrap the date callable with the convert
    for key in callable_time_props:
        if not is_nullish(props.get(key)):
            if not callable(props[key]):
                raise TypeError(f"{key} must be a callable")
            props[key] = _wrap_time_callable(props[key], converter)


def convert_date_for_labeled_value(
    date: JavaDate,
) -> Union[int, str, Tuple[int, str | None], None]:
    """
    Convert a Java date to an appropriate value for ui.labeled_value based on the date type.

    Args:
        date: The Java date to convert.

    Returns:
        Nanoseconds since epoch as an int or a local date as a str, and timezone identifier as a str if input is a ZonedDateTime.
    """
    if isinstance(date, DTypeInstant.j_type):
        return _convert_instant_to_nanos(date)

    if isinstance(date, DTypeZonedDateTime.j_type):
        tz = date.getZone()  # type: ignore
        instant = date.toInstant()  # type: ignore
        return (_convert_instant_to_nanos(instant), str(tz) if tz else None)

    if isinstance(date, DTypeLocalDate.j_type):
        return str(date)


def _convert_instant_to_nanos(instant: Instant) -> int:
    """
    Convert a Java Instant to nanoseconds since the epoch.

    Args:
        instant: The Java Instant to convert.

    Returns:
        The equivalent nanoseconds since the epoch.
    """
    seconds = instant.getEpochSecond()  # type: ignore
    nanos = instant.getNano()  # type: ignore
    return seconds * 1_000_000_000 + nanos


def unpack_item_table_source(
    children: tuple[Any, ...],
    props: dict[str, Any],
    supported_args: set[str],
) -> tuple[tuple[Any, ...], dict[str, Any]]:
    """
    Unpack children and props if the children are of type dict
    and merge the supported arguments into the props.

    Args:
        children: The children to possibly unpack.
        props: The props to unpack.
        supported_args: The supported arguments for the ItemTableSource.

    Returns:
        The unpacked children and props.
    """
    if len(children) == 1 and isinstance(children[0], dict):
        item_table_source = children[0].copy()
        children = (item_table_source.pop("table"),)
        for key in supported_args:
            if key in item_table_source:
                props[key] = item_table_source.pop(key)
    return children, props


def transform_node(
    value: Any, transform: Callable[[str, Any], Any], key: str = ""
) -> Any:
    """
    Deeply transform a given object depth-first and return a new object given a transform function.
    Useful for iterating through an object and converting values.

    Args:
        value: The object to transform
        transform: Function to be called for each key-value pair in the object, allowing for the value to be transformed.
        key: The key of the current object.

    Returns:
        A new object with the same keys as the original object, but with the values replaced by the return value of the callback. If there were no changes, returns the same object.
    """
    result = value
    if isinstance(result, dict):
        dict_result: Dict[str, Any] = result
        for child_key, child_value in dict_result.items():
            new_child_value = transform_node(child_value, transform, child_key)
            if not new_child_value is child_value:
                if dict_result is value:
                    dict_result = dict(dict_result)
                dict_result[child_key] = new_child_value
        result = dict_result
    elif is_iterable(result):
        array_result: List[Any] = result  # type: ignore
        for i, child_value in enumerate(array_result):
            new_child_value = transform_node(child_value, transform, str(i))
            if not new_child_value is child_value:
                if array_result is value:
                    array_result = list(array_result)
                array_result[i] = new_child_value
        result = array_result

    return transform(key, result)


def is_primitive(value: Any) -> bool:
    """
    Check if a value is a primitive type.

    Args:
        value: The value to check.

    Returns:
        True if the value is a primitive type, False otherwise.
    """
    return isinstance(value, (bool, float, int, str, type(None)))


def is_iterable(value: Any) -> bool:
    """
    Check if a value is standard iterable type.

    Args:
        value: The value to check.

    Returns:
        True if the value is a standard iterable type.
    """
    return isinstance(value, (list, tuple, set, dict, map, filter, range))
