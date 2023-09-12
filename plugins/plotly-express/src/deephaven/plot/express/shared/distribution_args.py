from ._update_wrapper import default_callback

SHARED_DEFAULTS = {
    "by_vars": "color",
    "unsafe_update_figure": default_callback,
    "x": None,
    "y": None,
}

VIOLIN_DEFAULTS = {
    "violinmode": "group",
    "points": "outliers",
    **SHARED_DEFAULTS,
}

BOX_DEFAULTS = {
    "boxmode": "group",
    "points": "outliers",
    **SHARED_DEFAULTS,
}

STRIP_DEFAULTS = {
    "stripmode": "group",
    **SHARED_DEFAULTS,
}

HISTOGRAM_DEFAULTS = {
    "barmode": "group",
    "nbins": 10,
    "histfunc": "count",
    "histnorm": None,
    "cumulative": False,
    "range_bins": None,
    "barnorm": None,
    **SHARED_DEFAULTS,
}
