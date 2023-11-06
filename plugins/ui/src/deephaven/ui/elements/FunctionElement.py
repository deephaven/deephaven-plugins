from __future__ import annotations
import logging
from typing import Callable
from deephaven.liveness_scope import LivenessScope
from .Element import Element
from .._internal import RenderContext, get_context, set_context

logger = logging.getLogger(__name__)


class FunctionElement(Element):
    def __init__(self, name: str, render: Callable[[], list[Element]]):
        """
        Create an element that takes a function to render.

        Args:
            name: Name of the component. Typically, the module joined with the name of the function.
            render: The render function to call when the component needs to be rendered.
        """
        self._name = name
        self._render = render
        self._liveness_scope = LivenessScope()


    @property
    def name(self):
        return self._name

    def release_liveness_scope(self):
        try: # May not have an active liveness scope or already been released
            self._liveness_scope.release()
            self._liveness_scope = None
        except:
            pass

    def __del__(self):
        self.release_liveness_scope()

    def render(self, context: RenderContext) -> list[Element]:
        """
        Render the component. Should only be called when actually rendering the component, e.g. exporting it to the client.

        Args:
            context: Context to render the component in

        Returns:
            The rendered component.
        """
        old_context = get_context()
        logger.debug("old context is %s and new context is %s", old_context, context)

        set_context(context)

        new_liveness_scope = LivenessScope()

        with context, new_liveness_scope.open():
            children = self._render()

        # Release after in case of memoized tables
        # Ref count goes 1 -> 2 -> 1 by releasing after
        # instead of 1 -> 0 -> 1 which would release the table
        self.release_liveness_scope()
        self._liveness_scope = new_liveness_scope

        logger.debug("Resetting to old context %s", old_context)
        set_context(old_context)

        return {"children": children}
