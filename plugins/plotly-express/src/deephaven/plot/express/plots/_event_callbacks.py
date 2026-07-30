from __future__ import annotations

from typing import Any, Callable, Iterable

from plotly.graph_objs import Figure

from ..deephaven_figure import DeephavenFigure


# Event callback param names that should be extracted from chart function args
_EVENT_CALLBACK_PARAMS = frozenset(
    {
        "on_click",
        "on_press",
        "on_double_click",
        "on_double_press",
        "on_selected",
        "on_deselect",
        "on_relayout",
        "on_legend_click",
        "on_legend_double_click",
        "on_click_annotation",
        "on_web_gl_context_lost",
    }
)


def _extract_event_callbacks(args: dict[str, Any]) -> dict[str, Callable]:
    """Extract event callback params from args dict

    Resolves aliases (on_press -> on_click, on_double_press -> on_double_click).

    Args:
        args: The chart function arguments (modified in place)

    Returns:
        A dict of event_name -> callback function for valid callbacks
    """
    callbacks: dict[str, Callable] = {}
    for param in _EVENT_CALLBACK_PARAMS:
        fn = args.pop(param, None)
        if fn is not None:
            # Resolve aliases
            if param == "on_press":
                callbacks.setdefault("on_click", fn)
            elif param == "on_double_press":
                callbacks.setdefault("on_double_click", fn)
            else:
                callbacks[param] = fn
    return callbacks


def _merge_event_callbacks(
    new_fig: DeephavenFigure,
    child_figs: Iterable[DeephavenFigure | Figure | None],
    direct_callbacks: dict[str, Callable],
) -> None:
    """Register event callbacks on a composed (layered/subplotted) figure.

    Callbacks inherited from the child figures are registered first, so that
    when multiple children define the same event the last child wins. The
    direct callbacks (passed as keyword arguments to the composing function,
    with aliases already resolved) are registered afterwards so they take
    precedence over the inherited ones.

    Args:
        new_fig: The composed figure to register callbacks on.
        child_figs: The figures being composed. Non-DeephavenFigure entries
            (plotly Figures or None) are skipped since they carry no callbacks.
        direct_callbacks: Event name to callback passed directly to the
            composing function, with aliases already resolved.
    """
    for fig in child_figs:
        if isinstance(fig, DeephavenFigure):
            for event_name, fn in fig._callbacks.items():
                new_fig._register_callback(event_name, fn)

    for event_name, fn in direct_callbacks.items():
        new_fig._register_callback(event_name, fn)
