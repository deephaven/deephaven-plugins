import unittest
from .BaseTest import BaseTestCase


def make_node(name: str, children: list, props: dict = None):
    from deephaven.ui.renderer import RenderedNode

    return RenderedNode(name, children, props)


class TestObject:
    """
    A test object that can be used to represent an exported object type
    """

    def __init__(self):
        pass


class DocumentTest(BaseTestCase):
    def expect_document(
        self, node, expected_root: dict, expected_exported_objects: list
    ):
        from deephaven.ui.renderer import Document

        document = Document(node)
        self.assertDictEqual(document.root, expected_root)
        self.assertListEqual(document.exported_objects, expected_exported_objects)

    def test_empty_document(self):
        self.expect_document(make_node("", []), {"name": "", "children": []}, [])

    def test_props(self):
        self.expect_document(
            make_node("test_node", [], {"foo": "bar"}),
            {"name": "test_node", "children": [], "props": {"foo": "bar"}},
            [],
        )

    def test_child(self):
        self.expect_document(
            make_node("test0", [make_node("test1", [])]),
            {"name": "test0", "children": [{"name": "test1", "children": []}]},
            [],
        )

    def test_children(self):
        self.expect_document(
            make_node(
                "test0",
                [
                    make_node("test1", [make_node("test2", [make_node("test3", [])])]),
                    make_node(
                        "test11", [make_node("test22", [make_node("test33", [])])]
                    ),
                ],
                {"foo": "bar"},
            ),
            {
                "name": "test0",
                "children": [
                    {
                        "name": "test1",
                        "children": [
                            {
                                "name": "test2",
                                "children": [{"name": "test3", "children": []}],
                            }
                        ],
                    },
                    {
                        "name": "test11",
                        "children": [
                            {
                                "name": "test22",
                                "children": [{"name": "test33", "children": []}],
                            }
                        ],
                    },
                ],
                "props": {"foo": "bar"},
            },
            [],
        )

    def test_exported_objects(self):
        obj1 = TestObject()

        self.expect_document(
            make_node("test_exported", [obj1]),
            {"name": "test_exported", "children": [{"object_id": 0}]},
            [obj1],
        )

    def exported_null(self):
        self.expect_document(
            make_node("test_exported", [None]),
            {"name": "test_exported", "children": [None]},
            [],
        )

    def test_children_with_exported(self):
        obj1 = TestObject()
        obj2 = TestObject()
        obj3 = TestObject()

        # Should use a depth-first traversal to find all exported objects and their indices
        self.expect_document(
            make_node(
                "test0", [make_node("test1", [obj1]), obj2, make_node("test3", [obj3])]
            ),
            {
                "name": "test0",
                "children": [
                    {"name": "test1", "children": [{"object_id": 0}]},
                    {"object_id": 1},
                    {"name": "test3", "children": [{"object_id": 2}]},
                ],
            },
            [obj1, obj2, obj3],
        )

    def test_primitive_children(self):
        self.expect_document(
            make_node("test0", ["foo", 1, 2.0]),
            {"name": "test0", "children": ["foo", 1, 2.0]},
            [],
        )

    def test_primitives_with_exports(self):
        obj1 = TestObject()
        obj2 = TestObject()

        self.expect_document(
            make_node("test0", ["foo", obj1, obj2, 2.0]),
            {
                "name": "test0",
                "children": ["foo", {"object_id": 0}, {"object_id": 1}, 2.0],
            },
            [obj1, obj2],
        )


if __name__ == "__main__":
    unittest.main()
