from .._internal import OnEventCallable, get_context


def use_event_queue() -> OnEventCallable:
    """
    Returns a callback function for adding events to the render queue.

    Returns:
        A callback function that takes an event to send on the render thread.
    """
    context = get_context()
    return context.queue_event
