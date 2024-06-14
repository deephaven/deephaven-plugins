from .basic import component_element

# TODO: Add pydocs #514
def radio_group(*children, **props):
    """
    Radio buttons allow users to select a single option from a list of mutually
    exclusive options. All possible options are exposed up front for users to
    compare.

    Args:
        children: The Radio(s) contained within the RadioGroup.
        **props: Any other RadioGroup props.
    """
    return component_element(f"RadioGroup", *children, **props)
