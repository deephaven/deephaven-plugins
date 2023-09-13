def get_component_name(comp):
    """
    Get the name of the component
    """
    return comp.__module__ + "." + comp.__qualname__


__all__ = ["get_component_name"]
