from sphinx.application import Sphinx
from sphinx_markdown_builder.translator import MarkdownTranslator  # type: ignore


class DeephavenTranslator(MarkdownTranslator):
    def visit_image(self, node):  # noqa: ANN001
        # Change image uri to original_uri if it exists since sphinx-markdown-builder just uses uri
        # This will give us proper relative image paths
        # See https://github.com/liran-funaro/sphinx-markdown-builder/issues/33 for more info
        node["uri"] = node.get("original_uri", node["uri"])
        super().visit_image(node)


def setup(app: Sphinx):
    """
    Setup the deephaven autodoc extension
    Adds the deephaven autodoc directive to the app

    Args:
        app: The Sphinx application

    Returns:
        The metadata for the extension
    """
    app.set_translator("markdown", DeephavenTranslator)

    return {
        "version": "0.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
