from deephaven.plugin.json import Node


def create():
    inner_1 = Node({"foo": "bar", "baz": 3.14})
    inner_2 = Node("Hello world")
    inner_2_ref_1 = inner_2.as_ref
    inner_2_ref_2 = inner_2.as_ref
    return Node(
        {
            "inner_1": inner_1,
            "inner_1_ref": inner_1.as_ref,
            "inner_2": inner_2,
            "inner_2_ref_1": inner_2_ref_1,
            "inner_2_ref_2": inner_2_ref_2,
            "inner_2_ref_1_again": inner_2_ref_1,
        }
    )


output = create()
