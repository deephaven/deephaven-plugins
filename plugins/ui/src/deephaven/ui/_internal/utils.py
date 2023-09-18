def get_component_name(component):
    """
    Get the name of the component

    Args:
        component: The component to get the name of.

    Returns:
        The name of the component.
    """
    return component.__module__ + "." + component.__name__


def get_component_qualname(component):
    """
    Get the name of the component

    Args:
        component: The component to get the name of.

    Returns:
        The name of the component.
    """
    return component.__module__ + "." + component.__qualname__
