import unittest
from .BaseTest import BaseTestCase


class HtmlTest(BaseTestCase):
    def test_html_element(self):
        from deephaven.ui.components.Element import ElementType
        from deephaven.ui.components.HTMLElement import HTMLElement

        element_type = ElementType()
        self.assertEqual(element_type.name, "deephaven.ui.components.Element.Element")

        def expect_exported(html_element: HTMLElement, expected: str):
            self.assertTrue(element_type.is_type(html_element))
            self.assertEqual(
                element_type.to_bytes(None, html_element), expected.encode()
            )

        expect_exported(HTMLElement("div"), '{"attributes":{},"tag":"div"}')
        expect_exported(
            HTMLElement("div", class_name="foo"),
            '{"attributes":{"class_name":"foo"},"tag":"div"}',
        )
        expect_exported(
            HTMLElement("span", class_name="foo"),
            '{"attributes":{"class_name":"foo"},"tag":"span"}',
        )


if __name__ == "__main__":
    unittest.main()
