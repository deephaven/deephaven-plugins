from .RenderContext import RenderContext
from typing import Optional


class UiSharedInternals:
    """
    Shared internal context for the deephaven.ui plugin to use when rendering.
    Should be set at the start of a render call, and unset at the end.

    TODO: Need to keep track of context for each given thread, in case we have multiple threads rendering at once.
    """

    _current_context: Optional[RenderContext] = None

    @property
    def current_context(self) -> RenderContext:
        return self._current_context


_deephaven_ui_shared_internals: UiSharedInternals = UiSharedInternals()


def get_context() -> RenderContext:
    return _deephaven_ui_shared_internals.current_context


def set_context(context):
    _deephaven_ui_shared_internals._current_context = context
