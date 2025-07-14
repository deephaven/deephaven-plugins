# Static Image Export

Convert a `DeephavenFigure` to a static image using the `to_image_uri` method.
In order to use this feature, you need to have the `kaleido` package installed.
Either install with `all` extras or install `kaleido` separately.

```sh
pip install 'deephaven-plugin-plotly-express[all]'
```

or

```sh
pip install "kaleido<1.0.0"
```

> [!WARNING]
> The image is generated on the server, so it does not have access to client-side information such as timezones or theme.
> The theme is customizable with the `template` argument, but the default is not the same as a client theme.

## `to_image`

The `to_image` method allows you to export a `DeephavenFigure` to bytes, which can be embedded as an image.

```python order=line_plot_image
import deephaven.plot.express as dx
from deephaven import ui

dog_prices = dx.data.stocks()

line_plot = dx.line(dog_prices, x="Timestamp", y="Price", by="Sym")

# Export the plot to bytes
line_plot_bytes = line_plot.to_image()

# Embed the image in a Deephaven UI image element
line_plot_image = ui.image(src=line_plot_bytes)
```

## Theme Template

Customize the theme with the `template` argument.
Default options are:

- `"plotly"`
- `"plotly_white"`
- `"plotly_dark"`
- `"ggplot2"`
- `"seaborn"`
- `"simple_white"`.

```python order=line_plot_image
import deephaven.plot.express as dx
from deephaven import ui

dog_prices = dx.data.stocks()

line_plot = dx.line(dog_prices, x="Timestamp", y="Price", by="Sym")

# Use the template to change the theme
line_plot_bytes = line_plot.to_image(template="ggplot2")

# Embed the image in a Deephaven UI image element
line_plot_image = ui.image(src=line_plot_bytes)
```

## Image Format

Customize the format with the `format` argument.
Options are `"png"`, `"jpg"`, `"jpeg"`, `"webp"`, `"svg"`, and `"pdf"`.

```python order=line_plot_image
import deephaven.plot.express as dx
from deephaven import ui

dog_prices = dx.data.stocks()

line_plot = dx.line(dog_prices, x="Timestamp", y="Price", by="Sym")

# Use the format argument to change the image format
line_plot_bytes = line_plot.to_image(format="jpg")

# Embed the image in a Deephaven UI image element
line_plot_image = ui.image(src=line_plot_bytes)
```

## Image Size

Customize the size with the `width` and `height` arguments. The values are in pixels.

```python order=line_plot_image
import deephaven.plot.express as dx
from deephaven import ui

dog_prices = dx.data.stocks()

line_plot = dx.line(dog_prices, x="Timestamp", y="Price", by="Sym")

# Use the width and height arguments to change the size
line_plot_bytes = line_plot.to_image(width=800, height=600)

# Embed the image in a Deephaven UI image element
line_plot_image = ui.image(src=line_plot_bytes)
```

## Write to a File

Export the image to bytes using the `to_image` method, then write the bytes to a file.

```python skip-test
import deephaven.plot.express as dx

dog_prices = dx.data.stocks()

line_plot = dx.line(dog_prices, x="Timestamp", y="Price", by="Sym")

# Export the plot to bytes
line_plot_bytes = line_plot.to_image()

# Write the image to a file in the current directory
with open("line_plot.png", "wb") as f:
    f.write(line_plot_bytes)
```
