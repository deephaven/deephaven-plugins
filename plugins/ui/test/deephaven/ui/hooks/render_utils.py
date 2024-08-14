from queue import Queue
from typing import Any, Callable, TypedDict, Union


class RenderHookResult(TypedDict):
    context: object
    result: Any
    rerender: Callable[..., Any]
    unmount: Callable[[], None]


def render_hook(
    fn: Callable[..., Any],
    *args: Any,
    queue: Union[Queue[Any], None] = None,
    **kwargs: Any,
) -> RenderHookResult:
    """
    Render a hook function and return the context, result, and a rerender function for updating it

    Args:
      fn: Callable:
        The function to render. Pass in a function with a hook call within it.
        Re-render will call the same function but with the new args passed in.
      queue: Queue:
        The queue to put items on. If not provided, a new queue will be created.
    """
    from deephaven.ui._internal.RenderContext import RenderContext

    if queue is None:
        queue = Queue()

    context = RenderContext(lambda x: queue.put(x), lambda x: queue.put(x))

    def _rerender(*args: Any, **kwargs: Any) -> Any:
        while not queue.empty():
            item = queue.get()
            item()
        with context.open():
            new_result = fn(*args, **kwargs)
            return_dict["result"] = new_result
        return new_result

    def _unmount() -> None:
        context.unmount()

    return_dict: RenderHookResult = {
        "context": context,
        "result": None,
        "rerender": _rerender,
        "unmount": _unmount,
    }

    _rerender(*args, **kwargs)

    return return_dict
