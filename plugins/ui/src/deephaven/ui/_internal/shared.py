from .RenderContext import RenderContext
from typing import Optional
import threading


class NoContextException(Exception):
    pass


_local_data = threading.local()


def get_context() -> RenderContext:
    try:
        return _local_data.context
    except AttributeError:
        raise NoContextException("No context set")


def set_context(context: Optional[RenderContext]):
    """
    Set the current context for the thread. Can be set to None to unset the context for a thread
    """
    if context is None:
        del _local_data.context
    else:
        _local_data.context = context
