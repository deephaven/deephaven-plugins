# Deephaven Sample Data

Deterministic sample datasets for [Deephaven](https://deephaven.io). Each function returns a Deephaven table that ticks by default; pass `ticking=False` for a static table.

These datasets were previously part of the `deephaven-plugin-plotly-express` package as `deephaven.plot.express.data`, which is now deprecated.

## Installation

```sh
pip install deephaven-sample-data
```

## Usage

```python
from deephaven import sample_data

iris = sample_data.iris()
stocks = sample_data.stocks(ticking=False)
```

### Available datasets

| Function      | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `iris`        | The classic Iris flower dataset, ticking.                           |
| `jobs`        | Synthetic job/task timeline data, suitable for timeline charts.     |
| `marketing`   | Synthetic marketing funnel data, suitable for funnel charts.        |
| `stocks`      | Synthetic stock trade data.                                         |
| `tips`        | The Tips dataset, ticking.                                          |
| `election`    | The Montreal election dataset, ticking.                             |
| `wind`        | The Wind dataset, ticking.                                          |
| `gapminder`   | The Gapminder dataset with interpolated monthly values, ticking.    |
| `fish_market` | Synthetic fish market data.                                         |
| `outages`     | Synthetic power outage data with locations, suitable for maps.      |
| `flights`     | Synthetic flight path data with locations, suitable for maps.       |

The `OUTAGE_CENTER` and `FLIGHT_CENTER` constants provide map centers for the `outages` and `flights` datasets.

## Migrating from `deephaven.plot.express.data`

Replace `dx.data.<dataset>()` with `sample_data.<dataset>()`:

```python
# Before (deprecated)
from deephaven.plot import express as dx

iris = dx.data.iris()

# After
from deephaven import sample_data

iris = sample_data.iris()
```
