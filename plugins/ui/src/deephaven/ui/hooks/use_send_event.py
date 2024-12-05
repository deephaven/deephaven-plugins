from .._internal import OnEventCallable, get_event_context


def use_send_event() -> OnEventCallable:
    """
    Returns a callback function for sending an event.

    Returns:
        A callback function that sends an event.
    """
    context = get_event_context()
    return context.send_event
