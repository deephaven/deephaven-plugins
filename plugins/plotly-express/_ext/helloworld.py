from __future__ import annotations

import docutils.nodes
import sphinx.addnodes
from sphinx.ext.autodoc.directive import AutodocDirective

from sphinx.application import Sphinx
from sphinx.util.typing import ExtensionMetadata
import re

ParamData = list[dict[str, str]]


def extract_parameter_defaults(
    node: sphinx.addnodes.desc_parameterlist,
) -> dict[str, str]:
    defaults = {}
    for child in node.children:
        params = child.astext().split("=")
        if len(params) == 2:
            defaults[params[0]] = params[1]
        # otherwise, no default value - do not add it because None is not the same as no default
    return defaults


def extract_signature_data(
    node: sphinx.addnodes.desc_signature,
) -> tuple[dict[str, str], dict[str, str]]:
    result = {}
    param_defaults = {}
    for child in node.children:
        if isinstance(child, sphinx.addnodes.desc_addname):
            result["module_name"] = child.astext()
        elif isinstance(child, sphinx.addnodes.desc_name):
            result["name"] = child.astext()
        elif isinstance(child, sphinx.addnodes.desc_parameterlist):
            param_defaults = extract_parameter_defaults(child)
    return result, param_defaults


def extract_list_item(node: docutils.nodes.list_item) -> dict[str, str]:
    field = node.astext().replace("\n", " ")
    matched = re.match(r"(.+) \((.*)\) -- (.+)", field).groups()
    param = {
        "name": matched[0],
        "type": matched[1],
        "description": matched[2],
    }
    return param


def extract_list_items(node: docutils.nodes.bullet_list) -> ParamData:
    return list(map(extract_list_item, node.children))


def extract_field_body(node: docutils.nodes.field_body) -> dict[str, str] | ParamData:
    # should only be one child, a paragraph or a list
    child = node.children[0]
    if isinstance(child, docutils.nodes.paragraph):
        return node.astext().replace("\n", " ")
    elif isinstance(child, docutils.nodes.bullet_list):
        return extract_list_items(child)


def extract_field(node: docutils.nodes.field) -> dict[str, str | ParamData]:
    name = None
    body = None
    for node in node.children:
        if isinstance(node, docutils.nodes.field_name):
            name = node.astext()
        elif isinstance(node, docutils.nodes.field_body):
            body = extract_field_body(node)
    return {name: body}


def extract_field_list(node: docutils.nodes.field_list) -> dict[str, str | ParamData]:
    result = {}
    for node in node.children:
        if isinstance(node, docutils.nodes.field):
            result.update(extract_field(node))
    return result


def extract_content_data(
    node: sphinx.addnodes.desc_content,
) -> dict[str, str | ParamData]:
    result = {}
    for node in node.children:
        if isinstance(node, docutils.nodes.field_list):
            result.update(extract_field_list(node))
        elif isinstance(node, docutils.nodes.paragraph):
            result["description"] = node.astext().replace("\n", " ")
    return result


def attach_parameter_defaults(
    params: list[dict], param_defaults: dict[str, str]
) -> None:
    for param in params:
        if (name := param["name"]) in param_defaults:
            param["default"] = param_defaults[name]


def extract_data(node: sphinx.addnodes.desc) -> dict[str, str | ParamData]:
    result = {}
    param_defaults = {}
    for node in node.children:
        if isinstance(node, sphinx.addnodes.desc_signature):
            signature_results, param_defaults = extract_signature_data(node)
            result.update(signature_results)
        elif isinstance(node, sphinx.addnodes.desc_content):
            result.update(extract_content_data(node))
    # map all to lowercase for consistency
    result["parameters"] = result.pop("Parameters")
    result["return_description"] = result.pop("Returns")
    result["return_type"] = result.pop("Return type")
    attach_parameter_defaults(result["parameters"], param_defaults)

    return result


def to_mdx(node: sphinx.addnodes.desc) -> docutils.nodes.TextElement:
    result = extract_data(node)
    import json

    dat = json.dumps(result, sort_keys=True, indent=4, separators=(",", ": "))

    return docutils.nodes.paragraph(text=dat)


class HelloWorld(AutodocDirective):
    def run(self) -> list:
        self.name = "autofunction"
        nodes = super().run()

        new_data = []

        for node in nodes:
            if isinstance(node, sphinx.addnodes.desc):
                new_data.append(to_mdx(node))
            # else:
            # new_data.append(node)

        print(nodes)
        print(new_data)
        return new_data


def setup(app: Sphinx) -> ExtensionMetadata:
    app.add_directive("helloworld", HelloWorld)

    return {
        "version": "0.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
