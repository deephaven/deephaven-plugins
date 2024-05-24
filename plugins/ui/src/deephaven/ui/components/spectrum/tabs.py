from typing import Callable
from .basic import spectrum_element, tab_list, tab_panels
from .flex import flex

# Draft 2
def tabs(*items):
    """
    Python implementation for Adobe React Spectrum Tabs.
    """
    tab_list = []
    tab_panels = []

    for item in items:
        tab_list.append(
            spectrum_element(
                "Item", item.title, key=item.key, text_value=item.text_value
            )
        )
        tab_panels.append(
            spectrum_element(
                "Item",
                flex(
                    item.content,
                    flex_grow=1,
                    direction="column",
                    height="100%",
                    width="100%",
                ),
                key=item.key,
                text_value=item.text_value,
            )
        )

    return tab_list, tab_panels


# Draft 1

# def tabs(
#     *tab_panel_args, on_selection_change: Callable[[bool], None] | None = None, **props
# ):
#     """
#     Python implementation for the Adobe React Spectrum Tabs component.
#     https://react-spectrum.adobe.com/react-spectrum/Tabs.html
#     """
#     tab_list_params = []
#     tab_panel_params = []

#     for tab_panel in tab_panel_args:
#         tab_item, panel_item = tab_panel

#         tab_list_params.append(tab_item)
#         tab_panel_params.append(panel_item)

#     return spectrum_element(
#         "Tabs",
#         tab_list(*tab_list_params),
#         tab_panels(*tab_panel_params, flex_grow=1, position="relative"),
#         on_selection_change=on_selection_change,
#         flex_grow=1,
#         **props
#     )
