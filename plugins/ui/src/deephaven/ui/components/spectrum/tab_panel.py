# Draft 1  ** Likely to remove if we are going to use ui.item, but here for reference (will delete if not used)

# from typing import Any
# from .flex import flex
# from .basic import spectrum_element


# def tab_panel(content: Any, title: Any, key: str | None = None):
#     """
#     Python implementation for a single Adobe React Spectrum Tab Panel.
#     """
#     text_value = title if isinstance(title, str) else None
#     key = key if key is not None else text_value

#     tab_item = spectrum_element("Item", title, key=key, text_value=text_value)
#     panel_item = spectrum_element(
#         "Item",
#         flex(content, flex_grow=1, direction="column", height="100%", width="100%"),
#         key=key,
#         text_value=text_value,
#     )

#     return tab_item, panel_item
