import logging
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)


def is_primitive(value):
    return type(value) in (str, int, float, bool)


def export_node(node: RenderedNode, exported_objects: list):
    """
    Export a rendered node to a serializable dict representation and add any exported objects to the exported objects array

    Args:
        node: The rendered node to export
        exported_node: The dict to export the node to
        exported_objects: The array to add any exported objects to

    Returns:
        The exported node

    """
    if isinstance(node, RenderedNode):
        logger.debug("export_node rendered_node: %s", node)

        children = node.children
        if children is not None:
            # if children is an array
            if isinstance(children, list):
                children = [
                    export_node(child, exported_objects) for child in node.children
                ]
            # if children is a single node
            else:
                children = export_node(children, exported_objects)

        exported_node = {
            "name": node.name,
            "children": children,
        }
        props = node.props
        if props:
            exported_node["props"] = props

        return exported_node
    elif node is None or is_primitive(node):
        logger.debug("export_node primitive: %s", node)
        return node
    else:
        logger.debug("export_node object: %s", node)
        exported_objects.append(node)
        return {
            "object_id": len(exported_objects) - 1,
        }


class Document:
    def __init__(self, node: RenderedNode):
        """
        Create a new document, which includes a serializable dict representation of the rendered node tree as well as an
        array of exported objects.
        The exported objects are objects that are referenced by the rendered node tree, but are not part of the tree.

        Args:
            node: The root node of the document

        """
        self._node = node

        exported_objects = []

        self._root = export_node(node, exported_objects)
        self._exported_objects = exported_objects

    @property
    def root(self):
        return self._root

    @property
    def exported_objects(self):
        return self._exported_objects
