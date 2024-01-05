import functools
import logging
from typing import Any, Callable
from .._internal import get_component_qualname
from ..elements import DashboardElement

logger = logging.getLogger(__name__)


def make_dashboard(func: Callable[..., Any]):
    """
    Create a DashboardElement from the passed in function.

    Args:
        func: The function to create a DashboardElement from.
              Runs when the component is being rendered.
    """

    @functools.wraps(func)
    def make_component_node(*args: Any, **kwargs: Any):
        component_type = get_component_qualname(func)

        return DashboardElement(component_type, lambda: func(*args, **kwargs))

    return make_component_node
