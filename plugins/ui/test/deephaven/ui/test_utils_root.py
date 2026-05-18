from __future__ import annotations

from typing import Callable, Dict, List


class TestRoot:
    """Minimal RootRenderContextProtocol implementation for tests.

    Accepts callbacks for on_change and on_queue_render, which default to
    immediately invoking the update.  Pass a Queue's ``put`` method to
    defer execution instead (used by render_hook).
    """

    def __init__(
        self,
        on_change: Callable[[Callable[[], None]], None] = lambda x: x(),
        on_queue_render: Callable[[Callable[[], None]], None] = lambda x: x(),
    ):
        self._on_change = on_change
        self._on_queue_render = on_queue_render
        self._url: str = ""

    def on_change(self, update: Callable[[], None]) -> None:
        self._on_change(update)

    def on_queue_render(self, update: Callable[[], None]) -> None:
        self._on_queue_render(update)

    def get_url(self) -> str:
        return self._url

    def set_url(self, url: str) -> None:
        self._url = url
