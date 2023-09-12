from .render import RenderContext
from typing import Optional


class UiSharedInternals:
    _current_context: Optional[RenderContext] = None

    @property
    def current_context(self) -> RenderContext:
        return self._current_context


_deephaven_ui_shared_internals: UiSharedInternals = UiSharedInternals()


def _get_context() -> RenderContext:
    return _deephaven_ui_shared_internals.current_context


def _set_context(context):
    _deephaven_ui_shared_internals._current_context = context
