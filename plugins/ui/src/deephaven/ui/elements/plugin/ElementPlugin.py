def register_element_plugins():
    from importlib.metadata import entry_points

    element_entry_points = entry_points(group="deephaven.ui.element")
    print("Element plugins found:", element_entry_points)


def test():
    print("Testing ElementPlugin registration...")
