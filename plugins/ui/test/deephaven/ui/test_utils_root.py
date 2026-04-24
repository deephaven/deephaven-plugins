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
        self._query_params: Dict[str, List[str]] = {}
        self._path: str = "/"
        self._absolute_path: str = "/"
        self._fragment: str = ""
        self._href: str = ""

    def on_change(self, update: Callable[[], None]) -> None:
        self._on_change(update)

    def on_queue_render(self, update: Callable[[], None]) -> None:
        self._on_queue_render(update)

    def get_query_params(self) -> Dict[str, List[str]]:
        return self._query_params

    def set_query_params(self, query_params: Dict[str, List[str]]) -> None:
        self._query_params = query_params

    def get_path(self) -> str:
        return self._path

    def set_path(self, path: str) -> None:
        self._path = path

    def get_absolute_path(self) -> str:
        return self._absolute_path

    def set_absolute_path(self, absolute_path: str) -> None:
        self._absolute_path = absolute_path

    def get_fragment(self) -> str:
        return self._fragment

    def set_fragment(self, fragment: str) -> None:
        self._fragment = fragment

    def get_href(self) -> str:
        return self._href

    def set_href(self, href: str) -> None:
        self._href = href
