from ..elements import BaseElement


def icon(name, *children, **props):
    """
    Get a Deephaven icon by name.
    """
    return BaseElement(f"deephaven.ui.icons.{name}", *children, **props)
