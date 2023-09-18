from .Element import Element


class TextElement(Element):
    def __init__(self, text: str):
        """
        A text fragment for HTML.

        Args:
            text: The text to display.
        """
        self._text = text

    @property
    def text(self):
        return self._text

    @property
    def children(self):
        return []

    @property
    def props(self):
        return {
            "text": self._text,
        }
