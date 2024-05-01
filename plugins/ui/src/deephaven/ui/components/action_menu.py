from ..elements import BaseElement


def action_menu(*children, **props):
    """
    ActionMenu combines an ActionButton with a Menu for simple "more actions" use cases.

    Args:
        children: A list of Item or primitive elements.
        **props: Any other ActionMenu prop.
    """
    return BaseElement(f"deephaven.ui.components.ActionMenu", *children, **props)
