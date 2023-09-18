from ..elements import HTMLElement


def flex(*children, **attributes):
    return HTMLElement("div", *children, style={"display": "flex"}, **attributes)


def flex_row(*children, **attributes):
    return HTMLElement(
        "div",
        *children,
        style={"display": "flex", "flex-direction": "row"},
        **attributes
    )


def flex_col(*children, **attributes):
    return HTMLElement(
        "div",
        *children,
        style={"display": "flex", "flex-direction": "column"},
        **attributes
    )
