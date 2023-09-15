import functools
import logging
from .._internal import RenderContext, get_context, set_context, get_component_name
from .node import UINode

logger = logging.getLogger(__name__)


def make_component(func):
    """
    Create a ComponentNode from the passed in function.
    """

    @functools.wraps(func)
    def make_component_node(*args, **kwargs):
        component_type = get_component_name(func)

        def render(context: RenderContext):
            """
            Render the component. Should only be called when actually rendering the component, e.g. exporting it to the client.

            Args:
                context: Context to render the component in

            Returns:
                The rendered component.
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
