from ..elements import BaseElement

# TODO: Add pydocs #515
def radio(*children, **props):
    """
    Radio buttons allow users to select a single option from a list of mutually
    exclusive options. All possible options are exposed up front for users to
    compare.

    Args:
        children: The label for the Radio. Accepts any renderable node.
        **props: Any other Radio props.
    """
    return BaseElement(f"deephaven.ui.components.Radio", *children, **props)
