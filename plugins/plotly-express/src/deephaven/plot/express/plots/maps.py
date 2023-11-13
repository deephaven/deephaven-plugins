from __future__ import annotations

from numbers import Number

from plotly import express as px

from deephaven.table import Table

from ._private_utils import process_args
from ..shared import default_callback


def scatter_geo(
    table: Table = None,
    lat: str = None,
    lon: str = None,
    locations: str = None,
    locationmode: str = None,
    geojson: str | dict = None,
    featureidkey: str = "id",
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    size: str | list[str] = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], str]]
    | dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], str]]
    | dict[str | tuple[str], str] = None,
    color_continuous_scale: list[str] = None,
    range_color: list[Number] = None,
    color_continuous_midpoint: Number = None,
    opacity: float = None,
    projection: str = None,
    scope: str = None,
    center: dict[str, float] = None,
    fitbounds: str = False,
    basemap_visible: bool = None,
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
):
    """
    Create a scatter_geo plot

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      lat: str:  (Default value = None)
        A column name to use for latitude values.
      lon: str:  (Default value = None)
        A column name to use for longitude values.
      locations: str:  (Default value = None)
        A column name to use for location values.
      locationmode: str:  (Default value = None)
        A location mode to use.
        One of ‘ISO-3’, ‘USA-states’, or ‘country names’.
        These map locations to predefined geographic regions.
      geojson: str | dict:  (Default value = None)
        GeoJSON data to use for geographic regions.
      featureidkey:  (Default value = "id")
        The feature ID key to use for geographic regions.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      text: str:  (Default value = None)
        A column that contains text annotations.
      hover_name: str:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused. This is overriden if "color" is specified.
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], str]]
        | dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused. This is overriden if "symbol" is specified.
      symbol_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden if "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], str]]
        | dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      color_continuous_scale: list[str]: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number]: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      projection: str:  (Default value = None)
        The projection type to use.
        Default depends on scope.
        One of 'equirectangular', 'mercator', 'orthographic', 'natural earth',
        'kavrayskiy7', 'miller', 'robinson', 'eckert4', 'azimuthal equal area',
        'azimuthal equidistant', 'conic equal area', 'conic conformal',
        'conic equidistant', 'gnomonic', 'stereographic', 'mollweide', 'hammer',
        'transverse mercator', 'albers usa', 'winkel tripel', 'aitoff', or
        'sinusoidal'
      scope: str:  (Default value = None)
        The scope of the map.
        Default of 'world', but forced to 'usa' if projection is 'albers usa'
        One of 'world', 'usa', 'europe', 'asia', 'africa', 'north america', or
        'south america'
      center: dict[str, float]:  (Default value = None)
        A dictionary of center coordinates.
        The keys should be 'lat' and 'lon' and the values should be floats
        that represent the lat and lon of the center of the map.
      fitbounds: str:  (Default value = False)
        One of False, 'locations', or 'geojson'
        If 'locations' or 'geojson', the map will zoom to the extent of the
        locations or geojson bounds respectively.
      basemap_visible: bool:  (Default value = None)
        If True, the basemap layer is visible.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
        DeephavenFigure: A DeephavenFigure that contains the scatter_geo figure
    """
    args = locals()

    return process_args(args, {"scatter"}, px_func=px.scatter_geo)


def scatter_mapbox(
    table: Table = None,
    lat: str = None,
    lon: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    size: str | list[str] = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], str]]
    | dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], str]]
    | dict[str | tuple[str], str] = None,
    color_continuous_scale: list[str] = None,
    range_color: list[Number] = None,
    color_continuous_midpoint: Number = None,
    opacity: float = None,
    zoom: float = None,
    center: dict[str, float] = None,
    mapbox_style: str = "open-street-map",
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
):
    """
    Create a scatter_mapbox plot

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      lat: str:  (Default value = None)
        A column name to use for latitude values.
      lon: str:  (Default value = None)
        A column name to use for longitude values.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      text: str:  (Default value = None)
        A column that contains text annotations.
      hover_name: str:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], str]]
        | dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      symbol_sequence: dict[str | tuple[str], str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      symbol_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], str]]
        | dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      color_continuous_scale: list[str]: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number]: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      zoom: float:  (Default value = None)
        The zoom level of the map.
      center: dict[str, float]:  (Default value = None)
        A dictionary of center coordinates.
        The keys should be 'lat' and 'lon' and the values should be floats
        that represent the lat and lon of the center of the map.
      mapbox_style: str:  (Default value = "open-street-map")
        The style of the map.
        One of 'open-street-map', 'white-bg', 'carto-positron', 'carto-darkmatter',
        and 'stamen-terrain', 'stamen-toner', 'stamen-watercolor'
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
        DeephavenFigure: A DeephavenFigure that contains the scatter_mapbox figure
    """
    args = locals()

    return process_args(args, {"scatter"}, px_func=px.scatter_mapbox)


def line_geo(
    table: Table = None,
    lat: str = None,
    lon: str = None,
    locations: str = None,
    locationmode: str = None,
    geojson: str | dict = None,
    featureidkey: str = "id",
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    size: str | list[str] = None,
    width: str = None,
    line_dash: str = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: dict[str | tuple[str], str] = None,
    size_sequence: list[float] = None,
    size_map: dict[str | tuple[str], str] = None,
    width_sequence: list[float] = None,
    width_map: dict[str | tuple[str], str] = None,
    line_dash_sequence: list[str] = None,
    line_dash_map: dict[str | tuple[str], str] = None,
    markers: bool = False,
    projection: str = None,
    scope: str = None,
    center: dict[str, float] = None,
    fitbounds: str = False,
    basemap_visible: bool = None,
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
):
    """
    Create a line_geo plot

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      lat: str:  (Default value = None)
        A column name to use for latitude values.
      lon: str:  (Default value = None)
        A column name to use for longitude values.
      locations: str:  (Default value = None)
        A column name to use for location values.
      locationmode: str:  (Default value = None)
        A location mode to use.
        One of ‘ISO-3’, ‘USA-states’, or ‘country names’.
        These map locations to predefined geographic regions.
      geojson: str | dict:  (Default value = None)
        GeoJSON data to use for geographic regions.
      featureidkey:  (Default value = "id")
        The feature ID key to use for geographic regions.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      width:
        A column or list of columns that contain width values.
        If only one column is passed, and it contains numeric values, the value
        is used as a width. Otherwise, the value is used for a plot by on width.
        See width_map for additional behaviors.
      line_dash:
        A column or list of columns that contain line_dash values.
        If only one column is passed, and it contains numeric values, the value
        is used as a line_dash. Otherwise, the value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      text:
        A column that contains text annotations.
      hover_name:
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused. This is overriden if "color" is specified.
      color_discrete_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused. This is overriden if "symbol" is specified.
      symbol_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        sizes, sizes will be reused. This is overriden if "size" is specified.
      size_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
      width_sequence: list[str]:  (Default value = None)
        A list of widths to sequentially apply to the
        markers in the series. The widths loop, so if there are more series than
        widths, widths will be reused. This is overriden if "width" is specified.
      width_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
      line_dash_sequence: list[str]:  (Default value = None)
        A list of line_dashes to sequentially apply to the
        markers in the series. The widths loop, so if there are more series than
        widths, widths will be reused. This is overriden if "line_dash" is specified.
      line_dash_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      markers: bool:  (Default value = False)
        If True, markers are shown.
      projection: str:  (Default value = None)
        The projection type to use.
        Default depends on scope.
        One of 'equirectangular', 'mercator', 'orthographic', 'natural earth',
        'kavrayskiy7', 'miller', 'robinson', 'eckert4', 'azimuthal equal area',
        'azimuthal equidistant', 'conic equal area', 'conic conformal',
        'conic equidistant', 'gnomonic', 'stereographic', 'mollweide', 'hammer',
        'transverse mercator', 'albers usa', 'winkel tripel', 'aitoff', or
        'sinusoidal'
      scope: str:  (Default value = None)
        The scope of the map.
        Default of 'world', but forced to 'usa' if projection is 'albers usa'
        One of 'world', 'usa', 'europe', 'asia', 'africa', 'north america', or
        'south america'
      center: dict[str, float]:  (Default value = None)
        A dictionary of center coordinates.
        The keys should be 'lat' and 'lon' and the values should be floats
        that represent the lat and lon of the center of the map.
      fitbounds: str:  (Default value = False)
        One of False, 'locations', or 'geojson'
        If 'locations' or 'geojson', the map will zoom to the extent of the
        locations or geojson bounds respectively.
      basemap_visible: bool:  (Default value = None)
        If True, the basemap layer is visible.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
        DeephavenFigure: A DeephavenFigure that contains the line_geo figure

    """
    args = locals()

    return process_args(args, {"line"}, px_func=px.line_geo)


def line_mapbox(
    table: Table = None,
    lat: str = None,
    lon: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str = None,
    text: str = None,
    size: str = None,
    symbol: str = None,
    width: str = None,
    line_dash: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    line_dash_sequence: list[str] = None,
    line_dash_map: dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: dict[str | tuple[str], str] = None,
    width_sequence: list[int] = None,
    width_map: dict[str | tuple[str], str] = None,
    zoom: float = None,
    mapbox_style: str = "open-street-map",
    center: dict[str, float] = None,
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
):
    """
    Create a line_mapbox plot

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      lat: str:  (Default value = None)
        A column name to use for latitude values.
      lon: str:  (Default value = None)
        A column name to use for longitude values.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      width:
        A column or list of columns that contain width values.
        If only one column is passed, and it contains numeric values, the value
        is used as a width. Otherwise, the value is used for a plot by on width.
        See width_map for additional behaviors.
      line_dash:
        A column or list of columns that contain line_dash values.
        If only one column is passed, and it contains numeric values, the value
        is used as a line_dash. Otherwise, the value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      text:
        A column that contains text annotations.
      hover_name:
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused. This is overriden if "color" is specified.
      color_discrete_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused. This is overriden if "symbol" is specified.
      symbol_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        sizes, sizes will be reused. This is overriden if "size" is specified.
      size_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
      width_sequence: list[str]:  (Default value = None)
        A list of widths to sequentially apply to the
        markers in the series. The widths loop, so if there are more series than
        widths, widths will be reused. This is overriden if "width" is specified.
      width_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
      line_dash_sequence: list[str]:  (Default value = None)
        A list of line_dashes to sequentially apply to the
        markers in the series. The widths loop, so if there are more series than
        widths, widths will be reused. This is overriden if "line_dash" is specified.
      line_dash_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      zoom: float:  (Default value = None)
        The zoom level of the map.
      center: dict[str, float]:  (Default value = None)
        A dictionary of center coordinates.
        The keys should be 'lat' and 'lon' and the values should be floats
        that represent the lat and lon of the center of the map.
      mapbox_style: str:  (Default value = "open-street-map")
        The style of the map.
        One of 'open-street-map', 'white-bg', 'carto-positron', 'carto-darkmatter',
        and 'stamen-terrain', 'stamen-toner', 'stamen-watercolor'
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
        DeephavenFigure: A DeephavenFigure that contains the line_mapbox figure

    """
    args = locals()

    return process_args(args, {"line"}, px_func=px.line_mapbox)


def density_mapbox(
    table: Table = None,
    lat: str = None,
    lon: str = None,
    z: str = None,
    hover_name: str = None,
    color_continuous_scale: list[str] = None,
    range_color: list[float] = None,
    color_continuous_midpoint: float = None,
    labels: dict[str, str] = None,
    radius: int = 30,
    opacity: float = None,
    zoom: float = None,
    center: dict[str, float] = None,
    mapbox_style: str = "open-street-map",
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
):
    """
    Create a density_mapbox plot

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      lat: str:  (Default value = None)
        A column name to use for latitude values.
      lon: str:  (Default value = None)
        A column name to use for longitude values.
      z: str:  (Default value = None)
        A column name to use for z values.
      hover_name: str:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_continuous_scale: list[str]: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number]: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number: (Default value = None)
        A number that is the midpoint of the color axis
      radius: int:  (Default value = 30)
        The radius of each point.
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      zoom: float:  (Default value = None)
        The zoom level of the map.
      center: dict[str, float]:  (Default value = None)
        A dictionary of center coordinates.
        The keys should be 'lat' and 'lon' and the values should be floats
        that represent the lat and lon of the center of the map.
      mapbox_style: str:  (Default value = "open-street-map")
        The style of the map.
        One of 'open-street-map', 'white-bg', 'carto-positron', 'carto-darkmatter',
        and 'stamen-terrain', 'stamen-toner', 'stamen-watercolor'
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
        DeephavenFigure: A DeephavenFigure that contains the density_mapbox figure
    """
    args = locals()

    return process_args(args, set(), px_func=px.density_mapbox)
