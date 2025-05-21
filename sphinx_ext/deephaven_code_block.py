from sphinx.application import Sphinx
from sphinx.util.docutils import SphinxDirective
from docutils import nodes


class CodeBlockDirective(SphinxDirective):
    """
    A directive to create a code block with a specific language.

    Myst parser drops the `arguments` parameter: https://github.com/executablebooks/MyST-Parser/blob/8a44f5d35197b19aab2f1fe35b6f1dce4960bce5/myst_parser/mdit_to_docutils/base.py#L736
    However when rendering a fence as a directive, it includes all the arguments.
    This directive is just a workaround to Myst dropping the arguments, and outputting the code block as intended.
    """

    has_content = True
    optional_arguments = 1
    final_argument_whitespace = True

    def run(self) -> list[nodes.Node]:
        """
        Run the directive and return the nodes to be added to the document.

        Returns:
            list[nodes.Node]: The nodes to be added to the document.
        """
        language = self.name
        info_string = " ".join(self.arguments)
        language_str = f"{language} {info_string}".strip()
        content = "\n".join(self.content)

        # Create a code block node with the specified language
        code_block_node = nodes.literal_block(content, content, language=language_str)
        return [code_block_node]


def setup(app: Sphinx):
    """
    Setup the deephaven autodoc extension
    Adds the deephaven autodoc directive to the app

    Args:
        app: The Sphinx application

    Returns:
        The metadata for the extension
    """
    app.add_directive("python", CodeBlockDirective)

    return {
        "version": "0.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
