# Example data

The Deephaven Express package includes several built-in, deterministically generated ticking datasets for testing and experimentation. These datasets initialize with a default number of rows and are designed to demonstrate a range of plot types and pivot table use cases.

These datasets are provided by the `deephaven-sample-data` package, which is installed as a dependency of Deephaven Express. Import them from `deephaven.sample_data`.

> [!WARNING]
> Accessing the datasets through `dx.data` (`deephaven.plot.express.data`) is deprecated and will be removed in a future release. Replace `dx.data.<dataset>()` with `sample_data.<dataset>()`.

### `iris` dataset

```python
from deephaven import sample_data

iris = sample_data.iris()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.iris
```

### `marketing` dataset

```python
from deephaven import sample_data

marketing = sample_data.marketing()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.marketing
```

### `jobs` dataset

```python
from deephaven import sample_data

jobs = sample_data.jobs()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.jobs
```

### `stocks` dataset

```python
from deephaven import sample_data

stocks = sample_data.stocks()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.stocks
```

### `tips` dataset

```python
from deephaven import sample_data

tips = sample_data.tips()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.tips
```

### `election` dataset

```python
from deephaven import sample_data

election = sample_data.election()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.election
```

### `wind` dataset

```python
from deephaven import sample_data

wind = sample_data.wind()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.wind
```

### `gapminder` dataset

```python
from deephaven import sample_data

gapminder = sample_data.gapminder()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.gapminder
```

### `fish_market` dataset

```python
from deephaven import sample_data

fish_market = sample_data.fish_market()
```

```{eval-rst}
.. dhautofunction:: deephaven.sample_data.fish_market
```
