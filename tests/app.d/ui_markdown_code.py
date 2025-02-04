from deephaven import ui


markdown_code = ui.markdown(
    """
This code block `print("Hello world")` should be in-line.

Here's a multi-line code block:
```
print("Hello there")
```
"""
)
