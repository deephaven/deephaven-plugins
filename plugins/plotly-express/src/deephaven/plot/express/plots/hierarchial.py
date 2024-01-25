from __future__ import annotations

from numbers import Number
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure

# The functions in this file are exempt from the styleguide rule that types should not be in the description if there
# is a type annotation.


def treemap(
    table: Table | None = None,
    names: str | None = None,
    values: str | None = None,
    parents: str | None = None,
    ids: str | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    color_continuous_scale: list[str] | None = None,
    range_color: list[Number] | None = None,
    color_continuous_midpoint: Number | None = None,
    labels: dict[str, str] | None = None,
    title: str | None = None,
    template: str | None = None,
    branchvalues: str | None = None,
    maxdepth: int | None = None,
    unsafe_update_figure: Callable = default_callback,
):
    """Returns a treemap chart

    Args:
      table: Table | None:  (Default value = None)
        A table to pull data from.
      names: str | None:  (Default value = None)
        The column containing names of the sections
      values: str | None:  (Default value = None)
        The column containing values of the sections
      parents: str | None:  (Default value = None)
        The column containing parents of the sections
      ids: str | None:  (Default value = None)
        The column containing ids of the sections. Unlike values, these
        must be unique. Values are used for ids if ids are not specified.
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      color_continuous_scale: list[str] | None: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number] | None: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number | None: (Default value = None)
        A number that is the midpoint of the color axis
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
        The template for the chart.
      branchvalues: str | None:  (Default value = None)
        Set to 'total' to take the value at a level to include
        all descendants and 'remainder' to the value as the remainder after
        subtracting leaf values.
      maxdepth: int | None:  (Default value = None)
        Sets the total number of visible levels. Set to -1 to
        render all levels.
      unsafe_update_figure: Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the treemap chart

    """
    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.treemap)


def sunburst(
    table: Table | None = None,
    names: str | None = None,
    values: str | None = None,
    parents: str | None = None,
    ids: str | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    color_continuous_scale: list[str] | None = None,
    range_color: list[Number] | None = None,
    color_continuous_midpoint: Number | None = None,
    labels: dict[str, str] | None = None,
    title: str | None = None,
    template: str | None = None,
    branchvalues: str | None = None,
    maxdepth: int | None = None,
    unsafe_update_figure: Callable = default_callback,
):
    """Returns a sunburst chart

    Args:
      table: Table | None:  (Default value = None)
        A table to pull data from.
      names: str | None:  (Default value = None)
        The column containing names of the sections
      values: str | None:  (Default value = None)
        The column containing values of the sections
      parents: str | None:  (Default value = None)
        The column containing parents of the sections
      ids: str | None:  (Default value = None)
        The column containing ids of the sections. Unlike values, these
        must be unique. Values are used for ids if ids are not specified.
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      color_continuous_scale: list[str] | None: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number] | None: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number | None: (Default value = None)
        A number that is the midpoint of the color axis
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
        The template for the chart.
      branchvalues: str | None:  (Default value = None)
        Set to 'total' to take the value at a level to include
        all descendants and 'remainder' to the value as the remainder after
        subtracting leaf values.
      maxdepth: int | None:  (Default value = None)
        Sets the total number of visible levels. Set to -1 to
        render all levels.
      unsafe_update_figure: Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the sunburst chart

    """
    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.sunburst)


def icicle(
    table: Table | None = None,
    names: str | None = None,
    values: str | None = None,
    parents: str | None = None,
    ids: str | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    color_continuous_scale: list[str] | None = None,
    range_color: list[Number] | None = None,
    color_continuous_midpoint: Number | None = None,
    labels: dict[str, str] | None = None,
    title: str | None = None,
    template: str | None = None,
    branchvalues: str | None = None,
    maxdepth: int | None = None,
    unsafe_update_figure: Callable = default_callback,
):
    """Returns a icicle chart

    Args:
      table: Table | None:  (Default value = None)
        A table to pull data from.
      names: str | None:  (Default value = None)
        The column containing names of the sections
      values: str | None:  (Default value = None)
        The column containing values of the sections
      parents: str | None:  (Default value = None)
        The column containing parents of the sections
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      ids: str | None:  (Default value = None)
        The column containing ids of the sections. Unlike values, these
        must be unique. Values are used for ids if ids are not specified.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      color_continuous_scale: list[str] | None: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number] | None: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number | None: (Default value = None)
        A number that is the midpoint of the color axis
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
        The template for the chart.
      branchvalues: str | None:  (Default value = None)
        Set to 'total' to take the value at a level to include
        all descendants and 'remainder' to the value as the remainder after
        subtracting leaf values.
      maxdepth: int | None:  (Default value = None)
        Sets the total number of visible levels. Set to -1 to
        render all levels.
      unsafe_update_figure: Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the icicle chart

    """
    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.icicle)


def funnel(
    table: Table | None = None,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    opacity: float | None = None,
    orientation: str | None = None,
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a funnel chart

    Args:
      table: Table | None:  (Default value = None)
        A table to pull data from.
      x: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain x-axis values.
      y: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain y-axis values.
      by: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain color and pattern_shape.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      text: str | None:  (Default value = None)
        A column that contains text annotations.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      opacity: float | None:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      orientation: str | None:  (Default value = None)
        "h" for horizontal or "v" for vertical
      log_x: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: list[int] | None:  (Default value = None)
        A list of two numbers that specify the range of the x-axis.
      range_y: list[int] | None:  (Default value = None)
        A list of two numbers that specify the range of the y-axis.
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
        The template for the chart.
      unsafe_update_figure: Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the funnel chart

    """
    args = locals()

    return process_args(args, {"marker", "supports_lists"}, px_func=px.funnel)


def funnel_area(
    table: Table | None = None,
    names: str | None = None,
    values: str | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    title: str | None = None,
    template: str | None = None,
    opacity: float | None = None,
    unsafe_update_figure: Callable = default_callback,
):
    """Returns a funnel area chart

    Args:
      table: Table | None:  (Default value = None)
        A table to pull data from.
      names: str | None:  (Default value = None)
        The column containing names of the sections
      values: str | None:  (Default value = None)
        The column containing values of the sections
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
        The template for the chart.
      opacity: float | None:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      unsafe_update_figure: Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the funnel area chart

    """

    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.funnel_area)
