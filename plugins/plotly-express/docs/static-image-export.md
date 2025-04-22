# Static Image Export

Convert a `DeephavenFigure` to a static image using the `to_image` method.

## `to_image`

The `to_image` method allows you to export a `DeephavenFigure` to bytes, which can be converted to a static image format.

> [!WARNING]
> The image is generated on the server, so it does not have access to client-side information such as timezones or theme.
> The theme is customizable with the `template` argument, but the default is not the same as a client theme.

```python
import base64
import deephaven.plot.express as dx
from deephaven import ui

dog_prices = dx.data.stocks()

line_plot = dx.line(dog_prices, x="Timestamp", y="Price", by="Sym")

# Convert the figure to a static base64 string
# Use the template to change the theme
bytes_str = line_plot.to_image(format="png", template="ggplot2")
base64_str = base64.b64encode(bytes_str)

# Create an HTML image element with the base64 string
img = ui.html.img(src="data:image/png;base64," + base64_str.decode())
```