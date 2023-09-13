from .use_ref import use_ref


def use_memo(func, dependencies):
    """
    Memoize the result of a function call. The function will only be called again if the dependencies change.

    Args:
        func: The function to memoize.
        dependencies: The dependencies to check for changes.

    Returns:
        The memoized result of the function call.
    """
    deps_ref = use_ref(None)
    value_ref = use_ref(None)

    if deps_ref.current != dependencies:
        value_ref.current = func()
        deps_ref.current = dependencies

    return value_ref.current
