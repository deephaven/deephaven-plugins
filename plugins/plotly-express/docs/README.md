---
id: deephaven-express
title: How to use Deephaven Express
---

[Deephaven Express](https://github.com/deephaven/deephaven-plugin-plotly-express) is a powerful plotting library built on top of [Plotly Express](https://plotly.com/python/plotly-express/) that enhances its capabilities by adding support for real-time Deephaven tables, automatic downsampling, and server-side data grouping and aggregation using the Deephaven query engine. This library seamlessly integrates real-time data from Deephaven with the interactive and expressive visualizations of Plotly Express, allowing you to easily plot or aggregate millions of data points.

:::caution
Please note these docs are under active development. We will continue adding examples and descriptions in the coming months. 
:::

## Features

- **Real-Time Deephaven Tables**: Deephaven Plotly Express enables direct integration with real-time Deephaven tables, allowing you to visualize and analyze data as it updates in real time.
- **Automatic Downsampling**: The library offers pixel accurate automatic downsampling that reduces the number of data points displayed, ensuring smooth and responsive visualizations even with large datasets.
- **Server-Side Data Grouping and Aggregation**: Deephaven Plotly Express leverages server-side processing capabilities to perform data grouping and aggregation directly within Deephaven, enabling efficient analysis of huge datasets without requiring data transfer.
- **Plotly Express Compatibility**: Built on top of Plotly Express, the library inherits its comprehensive set of features, enabling you to create stunning and interactive visualizations effortlessly. In most cases you can directly swap `px` for `dx` for instant compatibility.
- **Interactive Visualizations**: Deephaven Plotly Express supports interactive features such as zooming, panning, and hovering, allowing you to explore and interact with your data conveniently.
- **Easy-to-Use API**: The library provides a simple and intuitive API, making it easy for users to generate a wide range of visualizations and customize them according to their specific needs.
- **Single entry point**: `import deephaven.plot.express as dx` and get easy access to all plotting functions and built-in demo datasets.

## Plot Types

<!-- Update number if count changes -->

This page contains a collection of links to examples demonstrating 24 different plot types and usage scenarios. You can explore these examples to gain a better understanding of how to leverage the library in your projects.

### Basic Plots

[![Scatter plot](_assets/plot_icons/scatter.svg)](scatter.md)
[![Line plot](_assets/plot_icons/line.svg)](line.md)
[![Bar plot](_assets/plot_icons/bar.svg)](bar.md)
[![Area plot](_assets/plot_icons/area.svg)](area.md)
[![Pie plot](_assets/plot_icons/pie.svg)](pie.md)

### 1D Distribution Plots

[![Histogram](_assets/plot_icons/histogram.svg)](histogram.md)
[![Box plot](_assets/plot_icons/box.svg)](box.md)
[![Violin plot](_assets/plot_icons/violin.svg)](violin.md)
[![Strip plot](_assets/plot_icons/strip.svg)](strip.md)

### Financial Plots

[![Candlestick](_assets/plot_icons/candlestick.svg)](candlestick.md)
[![OHLC](_assets/plot_icons/ohlc.svg)](ohlc.md)

### Hierarchical Plots

[![Treemap](_assets/plot_icons/treemap.svg)](treemap.md)
[![Icicle](_assets/plot_icons/icicle.svg)](icicle.md)
[![Sunburst](_assets/plot_icons/sunburst.svg)](sunburst.md)
[![Funnel](_assets/plot_icons/funnel.svg)](funnel.md)
[![Funnel Area](_assets/plot_icons/funnel_area.svg)](funnel-area.md)

### 3D, Polar, Ternary and Other Plots

[![Scatter 3d](_assets/plot_icons/scatter_3d.svg)](scatter-3d.md)
[![Line 3d](_assets/plot_icons/line_3d.svg)](line-3d.md)
[![Scatter polar](_assets/plot_icons/scatter_polar.svg)](scatter-polar.md)
[![Line polar](_assets/plot_icons/line_polar.svg)](line-polar.md)
[![Scatter ternary](_assets/plot_icons/scatter_ternary.svg)](scatter-ternary.md)
[![Line ternary](_assets/plot_icons/line_ternary.svg)](line-ternary.md)
[![Timeline](_assets/plot_icons/timeline.svg)](timeline.md)

### Concepts

[![Plot by](_assets/plot_icons/plot_by_partition.svg)](plot-by.md)
[![Sub plot](_assets/plot_icons/sub_plot.svg)](sub-plots.md)
[![Layer plot](_assets/plot_icons/layer_plots.svg)](layer-plots.md)
[![Multiple axes](_assets/plot_icons/multiple_axes.svg)](multiple-axes.md)
[![Titles and legends](_assets/plot_icons/titles_legends.svg)](other.md)

## Getting Started

To create a real-time plot using Deephaven Plotly Express, run the following example with Deephaven:

```python order=my_plot,my_table
import deephaven.plot.express as dx

# Deephaven express includes a number of generated data sets for examples
my_table = dx.data.stocks()

# Create a line plot, and assign colors by distinct values in the `sym` column
my_plot = dx.line(table=my_table, x="timestamp", y="price", color="sym")
```

In this example, we create a Deephaven table and create a line plot of `timestamp` against `price` with automatic downsampling. A trace is created for each value in the `sym` column, each of which has a unique color.

## Contributing

We welcome contributions to Deephaven Plotly Express! If you encounter any issues, have ideas for improvements, or would like to add new features, please open an issue or submit a pull request on the [GitHub repository](https://github.com/deephaven/deephaven-plugins).

## License

Deephaven's Plotly Express plugin is licensed under the [Apache License 2.0](https://github.com/deephaven/deephaven-plugin-plotly-express/blob/main/LICENSE). You are free to use, modify, and distribute this library in compliance with the terms of the license.

## Acknowledgments

We would like to express our gratitude to the Plotly and the Plotly Express team for creating a remarkable plotting library and making it open-source. Their work forms the foundation of the Deephaven Plotly Express plugin.
