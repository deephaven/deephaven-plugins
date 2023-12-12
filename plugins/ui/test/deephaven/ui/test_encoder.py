import json
import unittest
from .BaseTest import BaseTestCase


def make_node(name: str, props: dict = None):
    from deephaven.ui.renderer import RenderedNode

    return RenderedNode(name, props)


class TestObject:
    """
    A test object that can be used to represent an exported object type
    """

    def __init__(self):
        pass


class EncoderTest(BaseTestCase):
    def expect_result(
        self,
        node,
        expected_payload: dict,
        expected_callables: list = [],
        expected_objects: list = [],
        callable_id_prefix="cb",
    ):
        from deephaven.ui.renderer import NodeEncoder

        encoder = NodeEncoder(callable_id_prefix=callable_id_prefix)
        result = encoder.encode_node(node)
        self.assertDictEqual(
            json.loads(result["encoded_node"]), expected_payload, "payloads don't match"
        )
        self.assertListEqual(
            list(result["callable_id_dict"].keys()),
            expected_callables,
            "callables don't match",
        )
        self.assertListEqual(
            result["new_objects"], expected_objects, "objects don't match"
        )

    def test_empty_document(self):
        self.expect_result(make_node(""), {"__dhElemName": ""})

    def test_props(self):
        self.expect_result(
            make_node("test_node", {"foo": "bar"}),
            {"__dhElemName": "test_node", "props": {"foo": "bar"}},
        )

    def test_child(self):
        self.expect_result(
            make_node("test0", {"children": make_node("test1")}),
            {
                "__dhElemName": "test0",
                "props": {"children": {"__dhElemName": "test1"}},
            },
        )

    def test_children(self):
        self.expect_result(
            make_node(
                "test0",
                {
                    "children": [
                        make_node(
                            "test1",
                            {
                                "children": [
                                    make_node(
                                        "test2", {"children": [make_node("test3")]}
                                    )
                                ]
                            },
                        ),
                        make_node(
                            "test11",
                            {
                                "children": [
                                    make_node(
                                        "test22", {"children": [make_node("test33")]}
                                    )
                                ]
                            },
                        ),
                    ],
                    "foo": "bar",
                },
            ),
            {
                "__dhElemName": "test0",
                "props": {
                    "children": [
                        {
                            "__dhElemName": "test1",
                            "props": {
                                "children": [
                                    {
                                        "__dhElemName": "test2",
                                        "props": {
                                            "children": [{"__dhElemName": "test3"}],
                                        },
                                    }
                                ],
                            },
                        },
                        {
                            "__dhElemName": "test11",
                            "props": {
                                "children": [
                                    {
                                        "__dhElemName": "test22",
                                        "props": {
                                            "children": [{"__dhElemName": "test33"}],
                                        },
                                    }
                                ],
                            },
                        },
                    ],
                    "foo": "bar",
                },
            },
        )

    def test_exported_objects(self):
        obj1 = TestObject()

        self.expect_result(
            make_node("test_exported", {"children": [obj1]}),
            {
                "__dhElemName": "test_exported",
                "props": {"children": [{"__dhObid": 0}]},
            },
            expected_objects=[obj1],
        )

    def exported_null(self):
        self.expect_result(
            make_node("test_exported", {"children": [None]}),
            {"__dhElemName": "test_exported", "props": {"children": [None]}},
        )

    def test_children_with_exported(self):
        obj1 = TestObject()
        obj2 = TestObject()
        obj3 = TestObject()

        # Should use a depth-first traversal to find all exported objects and their indices
        self.expect_result(
            make_node(
                "test0",
                {
                    "children": [
                        make_node("test1", {"children": [obj1]}),
                        obj2,
                        make_node("test3", {"children": [obj3]}),
                    ]
                },
            ),
            {
                "__dhElemName": "test0",
                "props": {
                    "children": [
                        {
                            "__dhElemName": "test1",
                            "props": {"children": [{"__dhObid": 0}]},
                        },
                        {"__dhObid": 1},
                        {
                            "__dhElemName": "test3",
                            "props": {"children": [{"__dhObid": 2}]},
                        },
                    ],
                },
            },
            expected_objects=[obj1, obj2, obj3],
        )

    def test_primitive_children(self):
        self.expect_result(
            make_node("test0", {"children": ["foo", 1, 2.0]}),
            {"__dhElemName": "test0", "props": {"children": ["foo", 1, 2.0]}},
            [],
        )

    def test_primitives_with_exports(self):
        obj1 = TestObject()
        obj2 = TestObject()

        self.expect_result(
            make_node("test0", {"children": ["foo", obj1, obj2, 2.0]}),
            {
                "__dhElemName": "test0",
                "props": {"children": ["foo", {"__dhObid": 0}, {"__dhObid": 1}, 2.0]},
            },
            expected_objects=[obj1, obj2],
        )

    def test_same_object(self):
        """
        If the same object is exported multiple times, it should only be exported once and referenced by the same ID.
        """
        obj1 = TestObject()

        self.expect_result(
            make_node("test0", {"children": [obj1, obj1]}),
            {
                "__dhElemName": "test0",
                "props": {"children": [{"__dhObid": 0}, {"__dhObid": 0}]},
            },
            expected_objects=[obj1],
        )

    def test_callable(self):
        cb1 = lambda: None

        self.expect_result(
            make_node("test0", {"foo": cb1}),
            {"__dhElemName": "test0", "props": {"foo": {"__dhCbid": "cb0"}}},
            expected_callables=[cb1],
        )

    def test_children_with_callables(self):
        cb1 = lambda: None
        cb2 = lambda: None
        cb3 = lambda: None

        # Should use a depth-first traversal to find all exported objects and their indices
        self.expect_result(
            make_node(
                "test0",
                {
                    "children": [
                        make_node("test1", {"foo": [cb1]}),
                        cb2,
                        make_node("test3", {"bar": cb3}),
                    ]
                },
            ),
            {
                "__dhElemName": "test0",
                "props": {
                    "children": [
                        {
                            "__dhElemName": "test1",
                            "props": {"foo": [{"__dhCbid": "cb0"}]},
                        },
                        {"__dhCbid": "cb1"},
                        {
                            "__dhElemName": "test3",
                            "props": {"bar": {"__dhCbid": "cb2"}},
                        },
                    ],
                },
            },
            expected_callables=[cb1, cb2, cb3],
        )

    def test_callables_and_objects(self):
        cb1 = lambda: None
        cb2 = lambda: None
        cb3 = lambda: None
        obj1 = TestObject()
        obj2 = TestObject()

        # Should use a depth-first traversal to find all exported objects and their indices
        self.expect_result(
            make_node(
                "test0",
                {
                    "children": [
                        make_node("test1", {"foo": [cb1]}),
                        cb2,
                        make_node("test3", {"bar": cb3, "children": [obj1, obj2]}),
                    ]
                },
            ),
            {
                "__dhElemName": "test0",
                "props": {
                    "children": [
                        {
                            "__dhElemName": "test1",
                            "props": {"foo": [{"__dhCbid": "cb0"}]},
                        },
                        {"__dhCbid": "cb1"},
                        {
                            "__dhElemName": "test3",
                            "props": {
                                "bar": {"__dhCbid": "cb2"},
                                "children": [
                                    {"__dhObid": 0},
                                    {"__dhObid": 1},
                                ],
                            },
                        },
                    ],
                },
            },
            expected_callables=[cb1, cb2, cb3],
            expected_objects=[obj1, obj2],
        )

    def test_same_callables(self):
        """
        If the same callable is exported multiple times, it should only be exported once and referenced by the same ID.
        """
        cb1 = lambda: None

        self.expect_result(
            make_node("test0", {"foo": [cb1, cb1]}),
            {
                "__dhElemName": "test0",
                "props": {"foo": [{"__dhCbid": "cb0"}, {"__dhCbid": "cb0"}]},
            },
            expected_callables=[cb1],
        )

    def test_callable_id_prefix(self):
        cb1 = lambda: None
        cb2 = lambda: None
        cb3 = lambda: None

        # Should use a depth-first traversal to find all exported objects and their indices
        self.expect_result(
            make_node(
                "test0",
                {
                    "children": [
                        make_node("test1", {"foo": [cb1]}),
                        cb2,
                        make_node("test3", {"bar": cb3}),
                    ]
                },
            ),
            {
                "__dhElemName": "test0",
                "props": {
                    "children": [
                        {
                            "__dhElemName": "test1",
                            "props": {"foo": [{"__dhCbid": "d2c0"}]},
                        },
                        {"__dhCbid": "d2c1"},
                        {
                            "__dhElemName": "test3",
                            "props": {"bar": {"__dhCbid": "d2c2"}},
                        },
                    ],
                },
            },
            expected_callables=[cb1, cb2, cb3],
            callable_id_prefix="d2c",
        )

    def test_delta_objects(self):
        """
        Test that the encoder retains IDs for objects and callables that are the same between encodings.
        Also check that the encoder only sends new objects in the most recent encoding.
        """

        from deephaven.ui.renderer import NodeEncoder

        objs = [TestObject(), TestObject(), TestObject()]
        cbs = [lambda: None, lambda: None, lambda: None]

        # Should use a depth-first traversal to find all exported objects and their indices
        encoder = NodeEncoder()
        node = make_node(
            "test0",
            {
                "children": [
                    make_node("test1", {"foo": [cbs[0]]}),
                    cbs[1],
                    make_node("test3", {"bar": cbs[2], "children": [objs[0], objs[1]]}),
                    make_node("test4", {"children": [objs[0], objs[2]]}),
                    objs[1],
                    make_node("test6", {"children": [objs[2]]}),
                ]
            },
        )

        result = encoder.encode_node(node)

        expected_payload = {
            "__dhElemName": "test0",
            "props": {
                "children": [
                    {
                        "__dhElemName": "test1",
                        "props": {"foo": [{"__dhCbid": "cb0"}]},
                    },
                    {"__dhCbid": "cb1"},
                    {
                        "__dhElemName": "test3",
                        "props": {
                            "bar": {"__dhCbid": "cb2"},
                            "children": [
                                {"__dhObid": 0},
                                {"__dhObid": 1},
                            ],
                        },
                    },
                    {
                        "__dhElemName": "test4",
                        "props": {"children": [{"__dhObid": 0}, {"__dhObid": 2}]},
                    },
                    {"__dhObid": 1},
                    {
                        "__dhElemName": "test6",
                        "props": {"children": [{"__dhObid": 2}]},
                    },
                ],
            },
        }

        self.assertDictEqual(
            json.loads(result["encoded_node"]), expected_payload, "payloads don't match"
        )
        self.assertListEqual(
            list(result["callable_id_dict"].keys()), cbs, "callables don't match"
        )
        self.assertListEqual(result["new_objects"], objs, "objects don't match")

        # Add some new objects and callables to the mix for next encoding
        delta_objs = [TestObject()]
        delta_cbs = [lambda: None]
        objs = [objs[0], None, objs[2], delta_objs[0]]
        cbs = [cbs[0], None, cbs[2], delta_cbs[0]]

        # Replace cb[1] and obj[1] with the new callable/object and encode again
        node = make_node(
            "test0",
            {
                "children": [
                    make_node("test1", {"foo": [cbs[0]]}),
                    cbs[3],
                    make_node("test3", {"bar": cbs[2], "children": [objs[0], objs[3]]}),
                    make_node("test4", {"children": [objs[0], objs[2]]}),
                    objs[3],
                    make_node("test6", {"children": [objs[2]]}),
                ]
            },
        )

        result = encoder.encode_node(node)
        expected_payload = {
            "__dhElemName": "test0",
            "props": {
                "children": [
                    {
                        "__dhElemName": "test1",
                        "props": {"foo": [{"__dhCbid": "cb0"}]},
                    },
                    {"__dhCbid": "cb3"},
                    {
                        "__dhElemName": "test3",
                        "props": {
                            "bar": {"__dhCbid": "cb2"},
                            "children": [
                                {"__dhObid": 0},
                                {"__dhObid": 3},
                            ],
                        },
                    },
                    {
                        "__dhElemName": "test4",
                        "props": {"children": [{"__dhObid": 0}, {"__dhObid": 2}]},
                    },
                    {"__dhObid": 3},
                    {
                        "__dhElemName": "test6",
                        "props": {"children": [{"__dhObid": 2}]},
                    },
                ],
            },
        }

        self.assertDictEqual(
            json.loads(result["encoded_node"]), expected_payload, "payloads don't match"
        )
        self.assertListEqual(
            list(result["callable_id_dict"].keys()),
            [cbs[0], cbs[2], cbs[3]],
            "callables don't match",
        )
        self.assertListEqual(result["new_objects"], delta_objs, "objects don't match")


if __name__ == "__main__":
    unittest.main()
