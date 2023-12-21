import functools
import logging
from typing import Any, Callable
from .._internal import get_component_qualname
from ..elements import FunctionElement

logger = logging.getLogger(__name__)


def make_component(func: Callable[..., Any]):
    """
    Create a FunctionalElement from the passed in function.

    Args:
        func: The function to create a FunctionalElement from.
              Runs when the component is being rendered.
    """

    @functools.wraps(func)
    def make_component_node(*args: Any, **kwargs: Any):
        component_type = get_component_qualname(func)

        return FunctionElement(component_type, lambda: func(*args, **kwargs))

    return make_component_node
