from deephaven.plugin.json import Node

output = Node(
    {
        "str": "bar",
        "int": 1,
        "float": 3.14,
        "None": None,
        "True": True,
        "False": False,
        "empty_list": [],
        "empty_tuple": (),
        "empty_dict": {},
        "list": ["hello", "world"],
        "tuple": ("Devin", 1987),
        "dict": {"foo": "bar", "baz": 31337},
    }
)
