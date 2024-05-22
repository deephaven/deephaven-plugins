from typing import Callable
from .flex import flex
from .basic import spectrum_element, tab_list, tab_panels


def tabs(
    *tab_definitions, on_selection_change: Callable[[bool], None] | None = None, **props
):
    """
    Python implementation for the Adobe React Spectrum Tabs component.
    https://react-spectrum.adobe.com/react-spectrum/Tabs.html
    """
    tab_list_params = []
    tab_panel_params = []

    for tab_def in tab_definitions:
        title, content = tab_def
        key = title if on_selection_change else None
        text_value = title if isinstance(title, str) else None

        tab_item = spectrum_element("Item", title, key=key, text_value=text_value)
        panel_item = spectrum_element(
            "Item",
            flex(content, flex_grow=1, direction="column", height="100%", width="100%"),
            key=key,
            text_value=text_value,
        )

        tab_list_params.append(tab_item)
        tab_panel_params.append(panel_item)

    return spectrum_element(
        "Tabs",
        tab_list(*tab_list_params),
        tab_panels(*tab_panel_params, flex_grow=1, position="relative"),
        on_selection_change=on_selection_change,
        **props
    )
