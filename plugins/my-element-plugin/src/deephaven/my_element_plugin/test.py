from deephaven import ui


@ui.component
def my_element(names):
    """
    A simple UI component that displays a message.
    """
    return ui.BaseElement("my.element.info", names=names)
