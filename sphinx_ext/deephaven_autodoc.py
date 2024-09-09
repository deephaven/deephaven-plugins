from __future__ import annotations

import re
import json
import sys
from typing import TypedDict, Union, List, Dict

if sys.version_info < (3, 11):
    from typing_extensions import NotRequired
else:
    from typing import NotRequired

import docutils.nodes
import sphinx.addnodes
from sphinx.ext.autodoc.directive import AutodocDirective

from sphinx.application import Sphinx


class ParamData(TypedDict):
    name: str
    type: str
    description: str
    default: NotRequired[str | None]


Params = List[ParamData]
ParamDefaults = Dict[str, str]


class FunctionMetadata(TypedDict):
    module_name: str
    name: str


class SignatureData(TypedDict):
    parameters: Params
    return_description: str
    return_type: str
    module_name: str
    name: str
    description: str


SignatureValue = Union[str, Params]


def extract_parameter_defaults(
    node: sphinx.addnodes.desc_parameterlist,
) -> ParamDefaults:
    """
    Extract the default values for the parameters from the parameter list

    Args:
        node: The node to extract the defaults from

    Returns:
        The parameter defaults
    """
    defaults = {}
    for child in node.children:
        params = child.astext().split("=")
        if len(params) == 2:
            defaults[params[0]] = params[1]
        # otherwise, no default value - do not add it because None is not the same as no default
    return defaults


def extract_signature_data(
    node: sphinx.addnodes.desc_signature,
) -> tuple[FunctionMetadata, ParamDefaults]:
    """
    Extract the signature data from the signature node
    The default values for the parameters are extracted from the signature

    Args:
        node: The node to extract the signature data from

    Returns:
        The function metadata and the parameter defaults
    """
    result = {}
    param_defaults = {}
    for child in node.children:
        if isinstance(child, sphinx.addnodes.desc_addname):
            result["module_name"] = child.astext()
        elif isinstance(child, sphinx.addnodes.desc_name):
            result["name"] = child.astext()
        elif isinstance(child, sphinx.addnodes.desc_parameterlist):
            param_defaults = extract_parameter_defaults(child)
    return FunctionMetadata(**result), param_defaults


def extract_list_item(node: docutils.nodes.list_item) -> ParamData:
    """
    Extract the param data from a list item

    Args:
        node: The node to extract the param data from

    Returns:
        The param data
    """
    field = node.astext()
    print(field)
    try:
        match = re.match(r"(.+?) \((.*?)\) -- (.+)", field, re.DOTALL)
        if match is None:
            raise ValueError(
                f"Could not match {field} to extract param data. "
                f"Verify this parameter is documented correctly within 'Args:' with type and description."
            )
        matched = match.groups()
    except AttributeError:
        raise ValueError(
            f"Could not match {field}."
            "Verify this parameter is documented correctly with type and description."
        )
    return ParamData(name=matched[0], type=matched[1], description=matched[2])


def extract_list_items(node: docutils.nodes.bullet_list) -> Params:
    """
    Extract the param data from a list of items

    Args:
        node: The node to extract the param data from

    Returns:
        The param data
    """
    return list(map(extract_list_item, node.children))


def extract_field_body(
    node: docutils.nodes.field_body,
    is_parameter: bool,
) -> SignatureValue:
    """
    Extract the body of a field node
    If a list, extract the list items
    If a paragraph, extract the text

    Args:
        node: The node to extract the body from
        is_parameter: Whether this is a parameter field

    Returns:
        The extracted body
    """
    # There should only be one child, a paragraph or a list
    child = node.children[0]
    is_paragraph = isinstance(child, docutils.nodes.paragraph)
    if is_paragraph and is_parameter:
        # this is still a parameter, likely the only one in its signature
        return [extract_list_item(child)]
    elif is_paragraph:
        return node.astext()
    elif isinstance(child, docutils.nodes.bullet_list):
        return extract_list_items(child)
    raise ValueError(
        f"Could not extract field body from {node}. "
        f"Verify that the parameters are formatted correctly."
    )


def extract_field(node: docutils.nodes.field) -> dict[str, SignatureValue]:
    """
    Extract the field data from a field node

    Args:
        node: The node to extract the field data from

    Returns:
        The extracted field data
    """
    name = None
    body = None
    for node in node.children:
        if isinstance(node, docutils.nodes.field_name):
            name = node.astext()
        elif isinstance(node, docutils.nodes.field_body):
            body = extract_field_body(node, name == "Parameters")
    if name is None or body is None:
        raise ValueError(
            f"Could not extract field data from {node}. "
            f"Verify that the parameters are formatted correctly."
        )
    return {name: body}


def extract_field_list(node: docutils.nodes.field_list) -> dict[str, SignatureValue]:
    """
    Extract the field data from a field list node

    Args:
        node: The node to extract the field data from

    Returns:
        The extracted field data
    """
    result = {}
    for node in node.children:
        if isinstance(node, docutils.nodes.field):
            result.update(extract_field(node))
    return result


def extract_content_data(
    node: sphinx.addnodes.desc_content,
) -> dict[str, SignatureValue]:
    """
    Extract the content data from a content node
    Children are either field lists or paragraphs
    Field lists contain the parameter data
    Paragraphs are the description

    Args:
        node: The node to extract the content data from

    Returns:
        The extracted content data
    """
    result = {}
    for child_node in node.children:
        if isinstance(child_node, docutils.nodes.field_list):
            result.update(extract_field_list(child_node))
        elif isinstance(child_node, docutils.nodes.paragraph):
            result["description"] = child_node.astext()

    return result


def attach_parameter_defaults(params: Params, param_defaults: ParamDefaults) -> None:
    """
    Attach the parameter defaults to the parameters

    Args:
        params: The parameters to attach the defaults to
        param_defaults: The defaults to attach
    """
    for param in params:
        if "name" in param and (name := param["name"]) in param_defaults:
            param["default"] = param_defaults[name]


def extract_desc_data(node: sphinx.addnodes.desc) -> SignatureData:
    """
    Extract the content of the description.
    Parameter defaults are extracted from the description signature

    Args:
        node: The node to extract the data from

    Returns:
        The extracted data
    """
    result = {}
    param_defaults = {}
    for child_node in node.children:
        if isinstance(child_node, sphinx.addnodes.desc_signature):
            signature_results, param_defaults = extract_signature_data(child_node)
            result.update(signature_results)
        elif isinstance(child_node, sphinx.addnodes.desc_content):
            result.update(extract_content_data(child_node))
    # map all to lowercase for consistency
    function = f"{result['module_name']}{result['name']}"
    try:
        result["parameters"] = result.pop("Parameters")
    except KeyError:
        raise ValueError(
            "Parameters missing from description. "
            f"Verify the function description for {function} is formatted correctly."
        )
    try:
        result["return_description"] = result.pop("Returns")
    except KeyError:
        raise ValueError(
            "Returns missing in description. "
            f"Verify that there is a 'Returns:' section in the description for {function}."
        )
    try:
        result["return_type"] = result.pop("Return type")
    except KeyError:
        raise ValueError(
            "Return type missing from signature. "
            f"Verify that the function signature for {function} has a return type."
        )

    attach_parameter_defaults(result["parameters"], param_defaults)

    return SignatureData(**result)


def to_mdx(node: sphinx.addnodes.desc) -> docutils.nodes.comment:
    """
    Convert the provided description node to a node that is a mdx component

    Args:
        node: The node to convert

    Returns:
        The resulting component
    """
    result = extract_desc_data(node)

    dat = json.dumps(result)

    param_table = f"<ParamTable param={{{dat}}} />"

    # This is a little hacky, but this way the markdown renderer will not escape the special characters
    # such as * and \. The comment markers will be removed by make_docs.py.
    return docutils.nodes.comment("", "", docutils.nodes.raw("", param_table))


class DeephavenAutodoc(AutodocDirective):
    def __init__(self, *args, **kwargs):
        # this is mostly just passthrough, but set the name to autofunction so it is processed correctly
        # by sphinx autodoc and other extensions before we extract the data
        super().__init__(*args, **kwargs)
        self.name = "autofunction"

    def run(self) -> list[docutils.nodes.TextElement]:
        """
        Create the mdx components for the autodoc directive.

        Returns:
            The mdx components.
        """
        nodes = super().run()

        new_data = []

        for node in nodes:
            if isinstance(node, sphinx.addnodes.desc):
                new_data.append(to_mdx(node))
        return new_data


def setup(app: Sphinx):
    """
    Setup the deephaven autodoc extension
    Adds the deephaven autodoc directive to the app

    Args:
        app: The Sphinx application

    Returns:
        The metadata for the extension
    """
    app.add_directive("dhautofunction", DeephavenAutodoc)

    return {
        "version": "0.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
