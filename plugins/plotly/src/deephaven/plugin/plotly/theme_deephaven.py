import plotly.graph_objects as go
import plotly.io as pio

bg_color = "#322f33"
grid_color = "#403e41"
line_color = "#5b5a5c"
title_color = "#f0f0ee"
paper_bgcolor = "#2d2a2e"
zeroline_color = "#c0bfbf"
button_bgcolor = "#c0bfbf"
button_color = "#2d2a2e"

deephaven = go.layout.Template(pio.templates["plotly_dark"])

pio.templates["deephaven"] = deephaven.update(
    layout={
        "paper_bgcolor": paper_bgcolor,
        "plot_bgcolor": bg_color,
        "font": {
            "family": "'Fira Sans', sans-serif",
            "color": title_color,
        },
        "title": {
            "font": {
                "color": title_color,
            },
            "x": 0.5,
        },
        "legend": {
            "font": {
                "color": title_color,
            },
        },
        "colorway": [
            "#76d9e4",
            "#9edc6f",
            "#fcd65b",
            "#aa9af4",
            "#f37e3f",
            "#f95d84",
            "#f0f0ee",
        ],
        "polar": {
            "angularaxis": {"gridcolor": grid_color, "linecolor": line_color},
            "bgcolor": bg_color,
            "radialaxis": {"gridcolor": grid_color, "linecolor": line_color},
        },
        "scene": {
            "xaxis": {
                "zerolinecolor": zeroline_color,
                "gridcolor": grid_color,
                "linecolor": line_color,
                "showgrid": True,
                "showline": True,
                "title": {
                    "font": {
                        "color": title_color,
                    }
                },
            },
            "yaxis": {
                "zerolinecolor": zeroline_color,
                "zerolinewidth": 2,
                "gridcolor": grid_color,
                "linecolor": line_color,
                "showline": True,
                "title": {
                    "font": {
                        "color": title_color,
                    }
                },
            },
            "zaxis": {
                "zerolinecolor": zeroline_color,
                "gridcolor": grid_color,
                "linecolor": line_color,
                "showline": True,
                "title": {
                    "font": {
                        "color": title_color,
                    }
                },
            },
        },
        "xaxis": {
            "showgrid": True,
            "showline": True,
            "gridcolor": grid_color,
            "linecolor": line_color,
            "zerolinecolor": zeroline_color,
            "zerolinewidth": 2,
        },
        "yaxis": {
            "showgrid": True,
            "showline": True,
            "gridcolor": grid_color,
            "linecolor": line_color,
            "zerolinecolor": zeroline_color,
        },
        "updatemenudefaults": {
            "bgcolor": button_bgcolor,
            "borderwidth": 0,
            "font": {"color": button_color},
        },
    }
)
