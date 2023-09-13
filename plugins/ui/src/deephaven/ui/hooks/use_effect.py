from .use_ref import use_ref


def use_effect(func, dependencies):
    """
    Call a function when the dependencies change. Optionally return a cleanup function to be called when dependencies change again or component is unmounted.

    Args:
        func: The function to call when the dependencies change.
        dependencies: The dependencies to check for changes.

    Returns:
        None
    """
    deps_ref = use_ref(None)
    cleanup_ref = use_ref(lambda: None)

    # Check if the dependencies have changed
    if deps_ref.current != dependencies:
        if cleanup_ref.current is not None:
            # Call the cleanup function from the previous effect
            cleanup_ref.current()

        # Dependencies have changed, so call the effect function and store the new cleanup that's returned
        cleanup_ref.current = func()

        # Update the dependencies
        deps_ref.current = dependencies
