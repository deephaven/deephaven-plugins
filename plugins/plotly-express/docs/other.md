# Titles, labels and legends

## Titles

Title text can be added to plots using the `title` parameter. The `title` parameter accepts a string, which will be used as the title text. The `title` parameter can be used with any plot type. Titles support a limited subset of html and css styling. For example, you can use `<br>` to add line breaks, and `<b>` to make text bold. Or you can use css styling to change the font size or color.

### Examples

## Labels

Axis labels can be added to plots using the `labels` parameter. The `labels` parameter accepts a dictionary, which maps axis names to label text. The `labels` parameter can be used with any plot type.

### Examples

## Legends

Legends are automatically added to plots when there are multiple series in the plot. Legends can be customized using the `unsafe_update_figure` parameter. For example, you can change the position of the legend, or hide the legend. The `unsafe_update_figure` parameter accepts a dictionary, which will be passed to the plotly `update_layout` function. The `unsafe_update_figure` parameter can be used with any plot type.

### Examples
