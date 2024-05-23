from typing import Callable
from .basic import spectrum_element, tab_list, tab_panels


def tabs(
    *tab_panel_args, on_selection_change: Callable[[bool], None] | None = None, **props
):
    """
    Python implementation for the Adobe React Spectrum Tabs component.
    https://react-spectrum.adobe.com/react-spectrum/Tabs.html
    """
    tab_list_params = []
    tab_panel_params = []

    for tab_panel in tab_panel_args:
        tab_item, panel_item = tab_panel

        tab_list_params.append(tab_item)
        tab_panel_params.append(panel_item)

    return spectrum_element(
        "Tabs",
        tab_list(*tab_list_params),
        tab_panels(*tab_panel_params, flex_grow=1, position="relative"),
        on_selection_change=on_selection_change,
        flex_grow=1,
        **props
    )
