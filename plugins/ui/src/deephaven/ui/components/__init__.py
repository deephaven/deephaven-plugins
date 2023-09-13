import functools
import logging
from ..render import RenderContext
from .._internal.shared import get_context, set_context
from ..utils import get_component_name
from .node import UINode, UINodeType
from .text import TextType, text
from .text_field import TextFieldType, text_field

logger = logging.getLogger(__name__)


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


__all__ = [
    "component",
    "text",
    "TextType",
    "text_field",
    "TextFieldType",
    "UINode",
    "UINodeType",
]
