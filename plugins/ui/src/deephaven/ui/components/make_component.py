import functools
import logging
from .._internal import get_component_qualname
from ..elements import FunctionElement

logger = logging.getLogger(__name__)


def make_component(func):
    """
    Create a FunctionalElement from the passed in function.
    """

    @functools.wraps(func)
    def make_component_node(*args, **kwargs):
        component_type = get_component_qualname(func)

        return FunctionElement(component_type, lambda: func(*args, **kwargs))

    return make_component_node
