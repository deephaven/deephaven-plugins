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

    This mirrors lightweight-charts' ``MouseEventParams`` — the data of every
    series at the event location, the hovered series, the pixel point, the
    logical index, the pane, and the modifier keys — rather than a bespoke
    model. Keys are camelCase to match both that upstream type and
    deephaven.ui's ``events.py`` (whose ``PressEvent`` uses ``shiftKey`` etc.).
    The event is a plain ``dict`` at runtime, so handlers read fields with
    ``e["seriesData"]``.

    Two deliberate deviations from the raw ``MouseEventParams``: the hovered
    ``ISeriesApi`` object becomes a string id (``hoveredSeries`` /
    ``hoveredSeriesId``), and ``time`` becomes a Deephaven ``timestamp``.

    Fields that cannot be resolved for a given press are omitted rather than
    set to ``None`` (e.g. pressing empty area outside the data range omits
    ``timestamp`` and ``hoveredSeries``).
    """

    type: PressEventType
    """``"press"`` or ``"doublePress"``."""

    timestamp: Any
    """Time of the data at the event location (``MouseEventParams.time``),
    mirroring the hovered series' time-column type: a Deephaven ``Instant`` for
    an ``Instant`` column, a ``ZonedDateTime`` (in the chart's displayed zone)
    for a ``ZonedDateTime`` column, and a timezone-aware UTC ``datetime`` as the
    fallback. Absent when the event is outside the data range."""

    hoveredSeries: str
    """Friendly id of the series under the cursor. Uses the rendered series
    title when present (``by=`` charts use the partition key as the runtime
    title), falling back to TVL's generated ``series_<n>`` id only when no
    title/key exists. Omitted when no series is hovered. This is the key into
    :attr:`seriesData`."""

    hoveredSeriesId: str
    """TVL's generated ``series_<n>`` id for the hovered series — a stable
    handle that does not change with title/key, for unambiguous server-side
    lookup. Omitted when no series is hovered."""

    seriesData: dict
    """Data of every series at the event location, keyed by friendly series id
    (matching :attr:`hoveredSeries`). Each value mirrors the series' data
    shape: ``{"value": ...}`` for line / area / baseline / histogram, or
    ``{"open", "high", "low", "close"}`` for candlestick / bar."""

    point: dict
    """Pixel location of the event as ``{"x": ..., "y": ...}``
    (``MouseEventParams.point``). Omitted when outside the chart."""

    logical: int
    """Logical index at the event location (``MouseEventParams.logical``)."""

    paneIndex: int
    """Index of the pane the event occurred in, when available."""

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
# (``DType.j_name``) that we mirror onto the event ``timestamp``.
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

# Optional fields copied through verbatim when present (camelCase, mirroring
# the wire payload and deephaven.ui's event convention).
_PASSTHROUGH_KEYS = (
    "hoveredSeries",
    "hoveredSeriesId",
    "seriesData",
    "point",
    "logical",
    "paneIndex",
)


def build_press_event(
    handler_id: str,
    payload: dict,
    time_converter: Callable[[int], Any] = ns_to_datetime,
) -> "TvlPressEvent":
    """Build a :class:`TvlPressEvent` from the client EVENT payload.

    The client payload mirrors lightweight-charts' ``MouseEventParams`` and is
    already camelCase, matching the event dict handlers consume.

    ``handler_id`` is ``"press"`` or ``"doublePress"`` and becomes the
    event ``type``. Optional fields (``hoveredSeries``, ``hoveredSeriesId``,
    ``seriesData``, ``point``, ``logical``, ``paneIndex``) are copied through
    only when present; ``timeNs`` is converted to ``timestamp`` via
    ``time_converter`` (omitted when the event was outside the data range,
    where the client sends no ``timeNs``). Modifier keys always resolve to a
    bool.

    ``time_converter`` lets the caller mirror the source time-column type
    (see :func:`time_converter_for`); it defaults to a UTC ``datetime``. A
    failing converter (e.g. a transient JVM error) degrades to ``datetime``
    rather than raising, so a press always carries a usable ``timestamp``.
    """
    event: TvlPressEvent = {"type": cast(PressEventType, handler_id)}
    for key in _MODIFIER_KEYS:
        event[key] = bool(payload.get(key, False))  # type: ignore[literal-required]
    for key in _PASSTHROUGH_KEYS:
        if payload.get(key) is not None:
            event[key] = payload[key]  # type: ignore[literal-required]
    time_ns = payload.get("timeNs")
    if time_ns is not None:
        try:
            event["timestamp"] = time_converter(time_ns)
        except Exception:  # noqa: BLE001 - never lose the press over a bad convert
            event["timestamp"] = ns_to_datetime(time_ns)
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
