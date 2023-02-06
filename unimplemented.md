# Unimplemented Plotly Express Functionality
## scatter
### color
Need improvements to plugin architecture to update charts.
New categories cannot be added.
We could partially implement for now and throw out unusable data.

### symbol
See color

### size
See color

### hover_name
Doable, but weird with wide data  
Example:
fig = px.scatter(test, x="Ints", y=["Ints2", "Floats"], hover_name="Ints2")

### hover_data
Doable, but buggy with wide data  
fig = px.scatter(test, x="Ints", y=["Ints2", "Floats"], hover_data="Floats")

### custom_data
Doable, but only useful if using as Dash or widget

### text
See color

### facet_row
See color

### facet_col
See color

### facet_col_wrap
Dependent on facet_col

### facet_row_spacing
Dependent on facet_row

### facet_col_spacing
Dependent on facet_col

### error_x
Possible, but px doesn't fully support on wide data.
All figure objects are given the same data.
Maybe a list of columns would work?

### error_x_minus
see error_x

### error_y
see error_x

### error_y_minus
see error_x

### animation_frame
Need improvements to plugin architecture to update charts.
New frames cannot be added.

### animation_group
See animation_frame

### category_orders
Doable, but not very useful until color, symbol, etc. is supported

### color_discrete_map
Doable, but not useful without color as it works on values within a column

### color_continuous_scale
Doable, but not useful without color as it works on numeric colors

### range_color
see color_continuous_scale

### color_continuous_midpoint
see color_continuous_scale

### symbol_sequence
Doable, but not useful without symbol

### symbol_map
see symbol_sequence

### size_max
Doable, but dependent on size

### trendline
Note: requires statsmodels library to be installed. 
Would require some sort of ongoing model update.
Regardless, need improvements to plugin architecture to update charts.

### trendline_options
Dependent on trendline

### trendline_color_override
Dependent on trendline

### trendline_scope
Dependent on trendline

### log_x
Should be doable. Requires a table data transform

### log_y
Should be doable. Requires a table data transform

### render_mode
Should we even support this? Seems like we should require webgl.

### width
Doable, but we don't support on client

### height
Doable, but we don't support on client