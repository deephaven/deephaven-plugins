from .icon import icon
from .make_component import make_component as component
from .fragment import fragment
from .panel import panel
from .spectrum import *
from .table import table
from . import html


__all__ = [
    "action_button",
    "button",
    "button_group",
    "checkbox",
    "component",
    "content",
    "contextual_help",
    "flex",
    "form",
    "fragment",
    "grid",
    "heading",
    "icon",
    "icon_wrapper",
    "illustrated_message",
    "html",
    "number_field",
    "item",
    "panel",
    "range_slider",
    "slider",
    "spectrum_element",
    "switch",
    "table",
    "tab_list",
    "tab_panels",
    "tabs",
    "text",
    "text_field",
    "toggle_button",
    "view",
    'row',
    'col'
]


def row(*args, **kwargs):
    return flex(direction="row", flex_grow=1, *args, **kwargs)


def col(*args, **kwargs):
    return flex(direction="column", flex_grow=1, *args, **kwargs)
