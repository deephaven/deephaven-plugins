from ..elements import BaseElement


# TODO: pydocs for action_group #481
def action_group(*children, **props):
    """
    An ActionGroup is a grouping of ActionButtons that are related to one another.

    Args:
        children: A list of Item or primitive elements.
        **props: Any other ActionGroup prop.
    """
    return BaseElement(f"deephaven.ui.components.ActionGroup", *children, **props)
