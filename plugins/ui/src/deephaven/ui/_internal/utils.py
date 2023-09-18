def get_component_name(component):
    """
    Get the name of the component

    Args:
        component: The component to get the name of.

    Returns:
        The name of the component.
    """
    try:
        return component.__module__ + "." + component.__name__
    except Exception as e:
        return component.__class__.__module__ + "." + component.__class__.__name__


def get_component_qualname(component):
    """
    Get the name of the component

    Args:
        component: The component to get the name of.

    Returns:
        The name of the component.
    """
    try:
        return component.__module__ + "." + component.__qualname__
    except Exception as e:
        return component.__class__.__module__ + "." + component.__class__.__qualname__
