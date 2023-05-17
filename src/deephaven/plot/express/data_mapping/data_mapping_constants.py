# need to override some args since they aren't named in the trace directly
# based on the variable name
# these are appended
CUSTOM_DATA_ARGS = {
    "error_x": "error_x/array",
    "error_x_minus": "error_x/arrayminus",
    "error_y": "error_y/array",
    "error_y_minus": "error_y/arrayminus",
    "error_z": "error_z/array",
    "error_z_minus": "error_z/arrayminus",
    "x_diff": "x",
    "size": "marker/size",
    "text": "text",
    "hover_name": "hovertext"
}

# override these data columns with different names
OVERRIDES = {
    "names": "labels",
    "x_start": "base",
}

# x_end is not used, the calculations are made in preprocessing step and passed to x
REMOVE = {
    "x_end",
}
