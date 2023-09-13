# Prototype for programmatic layouts/callbacks
# Uses a React-like syntax, with hooks
import functools
import logging
from .render import RenderContext
from ._internal.shared import get_context, set_context
from .utils import get_component_name

logger = logging.getLogger(__name__)


class UINode:
    def __init__(self, component_type, render):
        """
        Create a component node.

        Args:
            component_type: Type of the component. Typically, the module joined with the name of the function.
            render: The render function to call when the component needs to be rendered.
        """
        self._type = component_type
        self._render = render

    def render(self, context: RenderContext, render_deep=True):
        """
        Render the component.

        Args:
            context: The context to render the component in.
            render_deep: Whether to render the component's children.

        Returns:
            The rendered component.
        """

        def render_child(child, child_context):
            if isinstance(child, UINode):
                return child.render(child_context, render_deep)
            else:
                return child

        logger.debug("ComponentNode.render")

        result = self._render(context)

        if render_deep:
            # Array of children returned, render them all
            if isinstance(result, list):
                result = [
                    render_child(child, context.get_child_context(i))
                    for i, child in enumerate(result)
                ]
            else:
                result = render_child(result, context.get_child_context(0))
        return result

    @property
    def type(self):
        return self._type


def component(func):
    """
    Create a ComponentNode from the passed in function.
    """

    @functools.wraps(func)
    def make_component_node(*args, **kwargs):
        component_type = get_component_name(func)

        def render(context: RenderContext):
            """
            Render the component. Should only be called when actually rendering the component, e.g. exporting it to the client.
            :param context: Context to render the component in
            :return: The rendered component.
            """
            old_context = get_context()
            logger.debug(
                "old context is %s and new context is %s", old_context, context
            )

            set_context(context)
            context.start_render()

            result = func(*args, **kwargs)

            context.finish_render()
            logger.debug("Resetting to old context %s", old_context)
            set_context(old_context)
            return result

        return UINode(component_type, render)

    return make_component_node
