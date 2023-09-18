from ..elements import HTMLElement


def flex(*children, **attributes):
    return HTMLElement("div", *children, display="flex", **attributes)


def flex_row(*children, **attributes):
    return flex(*children, flex_direction="row", **attributes)


def flex_col(*children, **attributes):
    return flex(*children, flex_direction="column", **attributes)
