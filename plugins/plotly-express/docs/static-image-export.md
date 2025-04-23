# Static Image Export

Convert a `DeephavenFigure` to a static image using the `to_image_uri` method.

## `to_image_uri`

The `to_image_uri` method allows you to export a `DeephavenFigure` to a URI, which can be embedded as an image.

> [!WARNING]
> The image is generated on the server, so it does not have access to client-side information such as timezones or theme.
> The theme is customizable with the `template` argument, but the default is not the same as a client theme.

```python
import deephaven.plot.express as dx
from deephaven import ui

dog_prices = dx.data.stocks()

line_plot = dx.line(dog_prices, x="Timestamp", y="Price", by="Sym")

# Create a URI for the image
# Use the template to change the theme
line_plot_uri = line_plot.to_image_uri(format="png", template="ggplot2")

# Embed the image in a Deephaven UI image element
img = ui.html.img(src=line_plot_uri)
```