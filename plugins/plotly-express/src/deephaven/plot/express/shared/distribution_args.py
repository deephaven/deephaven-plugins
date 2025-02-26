from ._update_wrapper import default_callback

# This file contains the default arguments for the distribution plots, which
# have multiple entry points because they can be created from either a
# marginal or a user-created plot.

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
    "histfunc": None,
    "histnorm": None,
    "cumulative": False,
    "range_bins": None,
    "barnorm": None,
    **SHARED_DEFAULTS,
}

SPREAD_GROUPS = {"marker", "preprocess_spread", "supports_lists"}
