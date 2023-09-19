from ..elements import HTMLElement


def flex(*children, style: dict = {}, **attributes):
    return HTMLElement(
        "div", *children, style={"display": "flex", **style}, **attributes
    )


def flex_row(*children, style: dict = {}, **attributes):
    return flex(*children, style={"flex-direction": "row", **style}, **attributes)


def flex_col(*children, style: dict = {}, **attributes):
    return flex(*children, style={"flex-direction": "column", **style}, **attributes)
