from ..elements import HTMLElement


def div(*children, **attributes):
    return HTMLElement("div", *children, **attributes)


def span(*children, **attributes):
    return HTMLElement("span", *children, **attributes)


def h1(*children, **attributes):
    return HTMLElement("h1", *children, **attributes)


def h2(*children, **attributes):
    return HTMLElement("h2", *children, **attributes)


def h3(*children, **attributes):
    return HTMLElement("h3", *children, **attributes)


def h4(*children, **attributes):
    return HTMLElement("h4", *children, **attributes)


def h5(*children, **attributes):
    return HTMLElement("h5", *children, **attributes)


def h6(*children, **attributes):
    return HTMLElement("h6", *children, **attributes)


def p(*children, **attributes):
    return HTMLElement("p", *children, **attributes)


def a(*children, **attributes):
    return HTMLElement("a", *children, **attributes)


def ul(*children, **attributes):
    return HTMLElement("ul", *children, **attributes)


def ol(*children, **attributes):
    return HTMLElement("ol", *children, **attributes)


def li(*children, **attributes):
    return HTMLElement("li", *children, **attributes)


def table(*children, **attributes):
    return HTMLElement("table", *children, **attributes)


def thead(*children, **attributes):
    return HTMLElement("thead", *children, **attributes)


def tbody(*children, **attributes):
    return HTMLElement("tbody", *children, **attributes)


def tr(*children, **attributes):
    return HTMLElement("tr", *children, **attributes)


def th(*children, **attributes):
    return HTMLElement("th", *children, **attributes)


def td(*children, **attributes):
    return HTMLElement("td", *children, **attributes)
