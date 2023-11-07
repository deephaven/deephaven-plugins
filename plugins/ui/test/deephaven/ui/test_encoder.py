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
        payload = encoder.encode(node)
        self.assertDictEqual(
            json.loads(payload), expected_payload, "payloads don't match"
        )
        self.assertListEqual(
            encoder.callables, expected_callables, "callables don't match"
        )
        self.assertListEqual(encoder.objects, expected_objects, "objects don't match")

    def test_empty_document(self):
        self.expect_result(make_node(""), {"__dh_elem_name": ""})

    def test_props(self):
        self.expect_result(
            make_node("test_node", {"foo": "bar"}),
            {"__dh_elem_name": "test_node", "props": {"foo": "bar"}},
        )

    def test_child(self):
        self.expect_result(
            make_node("test0", {"children": make_node("test1")}),
            {
                "__dh_elem_name": "test0",
                "props": {"children": {"__dh_elem_name": "test1"}},
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
                "__dh_elem_name": "test0",
                "props": {
                    "children": [
                        {
                            "__dh_elem_name": "test1",
                            "props": {
                                "children": [
                                    {
                                        "__dh_elem_name": "test2",
                                        "props": {
                                            "children": [{"__dh_elem_name": "test3"}],
                                        },
                                    }
                                ],
                            },
                        },
                        {
                            "__dh_elem_name": "test11",
                            "props": {
                                "children": [
                                    {
                                        "__dh_elem_name": "test22",
                                        "props": {
                                            "children": [{"__dh_elem_name": "test33"}],
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
                "__dh_elem_name": "test_exported",
                "props": {"children": [{"__dh_obid": 0}]},
            },
            expected_objects=[obj1],
        )

    def exported_null(self):
        self.expect_result(
            make_node("test_exported", {"children": [None]}),
            {"__dh_elem_name": "test_exported", "props": {"children": [None]}},
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
                "__dh_elem_name": "test0",
                "props": {
                    "children": [
                        {
                            "__dh_elem_name": "test1",
                            "props": {"children": [{"__dh_obid": 0}]},
                        },
                        {"__dh_obid": 1},
                        {
                            "__dh_elem_name": "test3",
                            "props": {"children": [{"__dh_obid": 2}]},
                        },
                    ],
                },
            },
            expected_objects=[obj1, obj2, obj3],
        )

    def test_primitive_children(self):
        self.expect_result(
            make_node("test0", {"children": ["foo", 1, 2.0]}),
            {"__dh_elem_name": "test0", "props": {"children": ["foo", 1, 2.0]}},
            [],
        )

    def test_primitives_with_exports(self):
        obj1 = TestObject()
        obj2 = TestObject()

        self.expect_result(
            make_node("test0", {"children": ["foo", obj1, obj2, 2.0]}),
            {
                "__dh_elem_name": "test0",
                "props": {"children": ["foo", {"__dh_obid": 0}, {"__dh_obid": 1}, 2.0]},
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
                "__dh_elem_name": "test0",
                "props": {"children": [{"__dh_obid": 0}, {"__dh_obid": 0}]},
            },
            expected_objects=[obj1],
        )

    def test_callable(self):
        cb1 = lambda: None

        self.expect_result(
            make_node("test0", {"foo": cb1}),
            {"__dh_elem_name": "test0", "props": {"foo": {"__dh_cbid": "cb0"}}},
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
                "__dh_elem_name": "test0",
                "props": {
                    "children": [
                        {
                            "__dh_elem_name": "test1",
                            "props": {"foo": [{"__dh_cbid": "cb0"}]},
                        },
                        {"__dh_cbid": "cb1"},
                        {
                            "__dh_elem_name": "test3",
                            "props": {"bar": {"__dh_cbid": "cb2"}},
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
                "__dh_elem_name": "test0",
                "props": {
                    "children": [
                        {
                            "__dh_elem_name": "test1",
                            "props": {"foo": [{"__dh_cbid": "cb0"}]},
                        },
                        {"__dh_cbid": "cb1"},
                        {
                            "__dh_elem_name": "test3",
                            "props": {
                                "bar": {"__dh_cbid": "cb2"},
                                "children": [
                                    {"__dh_obid": 0},
                                    {"__dh_obid": 1},
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
                "__dh_elem_name": "test0",
                "props": {"foo": [{"__dh_cbid": "cb0"}, {"__dh_cbid": "cb0"}]},
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
                "__dh_elem_name": "test0",
                "props": {
                    "children": [
                        {
                            "__dh_elem_name": "test1",
                            "props": {"foo": [{"__dh_cbid": "d2c0"}]},
                        },
                        {"__dh_cbid": "d2c1"},
                        {
                            "__dh_elem_name": "test3",
                            "props": {"bar": {"__dh_cbid": "d2c2"}},
                        },
                    ],
                },
            },
            expected_callables=[cb1, cb2, cb3],
            callable_id_prefix="d2c",
        )


if __name__ == "__main__":
    unittest.main()
