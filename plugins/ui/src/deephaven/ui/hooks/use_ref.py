from .use_state import use_state


class Ref:
    """
    A simple object that just stores a reference to a value in `current`
    Use it with a `use_ref` hook.
    """

    def __init__(self, current):
        self.current = current


def use_ref(initial_value):
    """
    Store a reference to a value that will persist across renders.

    Args:
      initial_value: The initial value of the reference.

    Returns:
      A Ref object with a current property that you can get/set
    """
    ref, _ = use_state(Ref(initial_value))
    return ref
