"""Event payloads and handler plumbing for TvlChart press events.

This mirrors the deephaven.ui event convention: a handler is a plain Python
callable that receives a single event argument (a ``TvlPressEvent`` dict with
camelCase keys), or no argument at all. :func:`wrap_callable` adapts a handler
so the dispatcher can always call it with one positional argument regardless of
how many the handler actually declares.

Only ``on_press`` / ``on_double_press`` are supported in v1.
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from functools import partial
from inspect import signature
from typing import Any, Callable, Literal, Optional, TypedDict, Union, cast

_NS_PER_SECOND = 1_000_000_000

# Public handler ids advertised to the client in ``enabledHandlers``.
PRESS = "press"
DOUBLE_PRESS = "doublePress"

PressEventType = Literal["press", "doublePress"]


class TvlPressEvent(TypedDict, total=False):
    """A press (or double-press) on a rendered TVL chart.

    Keys are camelCase to mirror deephaven.ui's ``events.py``. The event is a
    plain ``dict`` at runtime, so handlers read fields with ``e["seriesId"]``.

    Fields that cannot be resolved for a given press are omitted rather than
    set to ``None`` (e.g. pressing empty area outside the data range omits
    ``time``; pressing between lines omits ``seriesId``).
    """

    type: PressEventType
    """``"press"`` or ``"doublePress"``."""

    time: Any
    """The pressed time, mirroring the source series' time-column type: a
    Deephaven ``Instant`` for an ``Instant`` column, a ``ZonedDateTime`` (in
    the chart's displayed zone) for a ``ZonedDateTime`` column, and a
    timezone-aware UTC ``datetime`` as the fallback. Absent when the press is
    on empty area outside the data range."""

    seriesId: str
    """The id of the series under the cursor (from LWC native hit testing),
    absent when the press lands between lines."""

    price: float
    """Value at the cursor on the cursor pane's price scale, when available."""

    seriesData: dict
    """Every series' value/OHLC at the pressed time, keyed by series id."""

    point: dict
    """``{"x": int, "y": int}`` — cursor location in chart pixels."""

    paneIndex: int
    """Index of the pane the press landed in, when available."""

    shiftKey: bool
    ctrlKey: bool
    metaKey: bool
    altKey: bool


# A handler takes the event dict, or nothing at all.
PressEventCallable = Union[Callable[[TvlPressEvent], None], Callable[[], None]]


def ns_to_datetime(time_ns: int) -> datetime:
    """Convert UTC epoch nanoseconds to a timezone-aware UTC ``datetime``.

    Seconds and sub-second nanos are split so the conversion is exact to
    microsecond resolution (``datetime`` cannot hold nanoseconds; the
    remaining nanos are truncated). The client sends ``timeNs`` already
    shifted back to real UTC (its ``unconvertTime`` undoes the display-tz
    offset), so no timezone math happens here.

    Used as the fallback when the source time-column type is unknown or a
    Deephaven date type cannot be built (see :func:`time_converter_for`).
    """
    seconds, sub_ns = divmod(int(time_ns), _NS_PER_SECOND)
    base = datetime.fromtimestamp(seconds, tz=timezone.utc)
    return base + timedelta(microseconds=sub_ns // 1000)


def ns_to_instant(time_ns: int) -> Any:
    """Convert UTC epoch nanoseconds to a Deephaven ``Instant``.

    ``deephaven.time`` is imported lazily so this module still imports
    without a running server (the conversion itself needs the JVM).
    """
    from deephaven.time import to_j_instant

    return to_j_instant(int(time_ns))


def ns_to_zoned_date_time(time_ns: int, time_zone: Optional[str] = None) -> Any:
    """Convert UTC epoch nanoseconds to a Deephaven ``ZonedDateTime``.

    The press travels over the wire as a plain UTC instant, so the source
    column's original per-row zone is not recoverable. We reconstruct the
    value in ``time_zone`` — the IANA zone the chart rendered in — falling
    back to the Deephaven system zone when the client did not send one. This
    matches what the user saw on the time axis.
    """
    from deephaven.dtypes import ZonedDateTime
    from deephaven.time import dh_time_zone, to_j_instant, to_j_time_zone

    instant = to_j_instant(int(time_ns))
    zone = to_j_time_zone(time_zone) if time_zone else dh_time_zone()
    return ZonedDateTime.j_type.ofInstant(instant, zone)  # type: ignore[attr-defined]


# Fully-qualified Java class names of the source time column's dtype
# (``DType.j_name``) that we mirror onto the event ``time``.
_INSTANT_JNAME = "java.time.Instant"
_ZONED_DATE_TIME_JNAME = "java.time.ZonedDateTime"


def time_converter_for(
    time_type_name: Optional[str], time_zone: Optional[str] = None
) -> Callable[[int], Any]:
    """Pick a ``nanos -> value`` converter that mirrors the source column type.

    ``time_type_name`` is the source time column's ``DType.j_name`` (or
    ``None`` when it could not be resolved):

    - ``java.time.Instant``       -> Deephaven ``Instant``
    - ``java.time.ZonedDateTime`` -> Deephaven ``ZonedDateTime`` (in ``time_zone``)
    - anything else / ``None``    -> timezone-aware UTC ``datetime`` (fallback)
    """
    if time_type_name == _INSTANT_JNAME:
        return ns_to_instant
    if time_type_name == _ZONED_DATE_TIME_JNAME:
        return lambda ns: ns_to_zoned_date_time(ns, time_zone)
    return ns_to_datetime


_MODIFIER_KEYS = ("shiftKey", "ctrlKey", "metaKey", "altKey")


def build_press_event(
    handler_id: str,
    payload: dict,
    time_converter: Callable[[int], Any] = ns_to_datetime,
) -> "TvlPressEvent":
    """Build a :class:`TvlPressEvent` from the client EVENT payload.

    ``handler_id`` is ``"press"`` or ``"doublePress"`` and becomes the
    event ``type``. Optional fields (``seriesId``, ``price``, ``point``,
    ``paneIndex``) are copied through only when present; ``timeNs`` is
    converted to ``time`` via ``time_converter`` (omitted when the press was
    on empty area, where the client sends no ``timeNs``). Modifier keys
    always resolve to a bool.

    ``time_converter`` lets the caller mirror the source time-column type
    (see :func:`time_converter_for`); it defaults to a UTC ``datetime``. A
    failing converter (e.g. a transient JVM error) degrades to ``datetime``
    rather than raising, so a press always carries a usable ``time``.
    """
    event: TvlPressEvent = {"type": cast(PressEventType, handler_id)}
    for key in _MODIFIER_KEYS:
        event[key] = bool(payload.get(key, False))  # type: ignore[literal-required]
    if payload.get("seriesId") is not None:
        event["seriesId"] = payload["seriesId"]
    if payload.get("price") is not None:
        event["price"] = payload["price"]
    if payload.get("seriesData") is not None:
        event["seriesData"] = payload["seriesData"]
    if payload.get("point") is not None:
        event["point"] = payload["point"]
    if payload.get("paneIndex") is not None:
        event["paneIndex"] = payload["paneIndex"]
    time_ns = payload.get("timeNs")
    if time_ns is not None:
        try:
            event["time"] = time_converter(time_ns)
        except Exception:  # noqa: BLE001 - never lose the press over a bad convert
            event["time"] = ns_to_datetime(time_ns)
    return event


def _wrapped_callable(
    max_args: Optional[int],
    func: Callable,
    *args: Any,
) -> Any:
    """Call ``func`` with at most ``max_args`` positional arguments.

    ``max_args`` is ``None`` when the function accepts ``*args`` (pass
    everything through).
    """
    if max_args is not None:
        args = args[:max_args]
    return func(*args)


def wrap_callable(func: Callable) -> Callable:
    """Adapt a handler so it can always be invoked with one positional arg.

    Ported from deephaven.ui's ``_internal/utils.wrap_callable`` (positional
    arity only — TVL handlers never receive keyword arguments). A handler
    declaring zero parameters and one declaring a single ``event`` parameter
    are both valid; surplus positional arguments are dropped.
    """
    try:
        if sys.version_info[0] == 3 and sys.version_info[1] >= 10:
            sig = signature(func, eval_str=True)  # type: ignore[call-arg]
        else:
            sig = signature(func)

        max_args: Optional[int] = 0
        for param in sig.parameters.values():
            if param.kind in (
                param.POSITIONAL_ONLY,
                param.POSITIONAL_OR_KEYWORD,
            ):
                max_args = cast(int, max_args) + 1
            elif param.kind == param.VAR_POSITIONAL:
                max_args = None
            # KEYWORD_ONLY / VAR_KEYWORD params are never supplied by the
            # dispatcher, so they don't affect the positional budget.
        return partial(_wrapped_callable, max_args, func)
    except (ValueError, TypeError):
        # Builtins and some C callables have no introspectable signature.
        return func
