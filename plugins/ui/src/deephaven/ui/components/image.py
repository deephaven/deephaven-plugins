from ..elements import BaseElement


def image(*children, **props):
    """
    Image is used to insert and display an image within a component.

    Args:
        src: The URL of the image.
        alt: Text description of the image.
        object_fit: How the image should be resized to fit its container.
        **props: Any other RadioGroup props.
    """
    return BaseElement(f"deephaven.ui.components.Image", *children, **props)
