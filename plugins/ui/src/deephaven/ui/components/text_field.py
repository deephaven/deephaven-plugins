from ..elements import TextField


def text_field(value, on_change, **props):
    """
    Create a TextField component.

    Args:
        value: The initial value of the text field.
        on_change: The function to call when the text field changes.
    """
    return TextField(value, on_change, **props)
