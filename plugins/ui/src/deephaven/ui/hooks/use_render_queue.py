from .._internal import OnChangeCallable, get_context


def use_render_queue() -> OnChangeCallable:
    """
    Returns a callback function for adding things to the render queue.
    Should only be used if you're loading data from a background thread and want to update state.

    Returns:
        A callback function that takes a function to call on the render thread.
    """
    context = get_context()
    return context.queue_render
