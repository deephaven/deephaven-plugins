# Deephaven Plugin for Matplotlib

The Deephaven Plugin for Matplotlib. Allows for opening Matplotlib plots in a Deephaven environment. Any Matplotlib plot
should be viewable by default. For example:

```python
import matplotlib.pyplot as plt

fig = plt.figure()
ax = fig.subplots()  # Create a figure containing a single axes.
ax.plot([1, 2, 3, 4], [4, 2, 6, 7])  # Plot some data on the axes.
```

You can also use `TableAnimation`, which allows updating a plot whenever a Deephaven Table is updated.

## `TableAnimation` Usage

`TableAnimation` is a Matplotlib `Animation` that is driven by updates in a Deephaven Table. Every time the table that
is being listened to updates, the provided function will run again.

### Line Plot

```python
import matplotlib.pyplot as plt
from deephaven import time_table
from deephaven.plugin.matplotlib import TableAnimation

# Create a ticking table with the sin function
tt = time_table("PT00:00:01").update(["x=i", "y=Math.sin(x)"])

fig = plt.figure()  # Create a new figure
ax = fig.subplots()  # Add an axes to the figure
(line,) = ax.plot(
    [], []
)  # Plot a line. Start with empty data, will get updated with table updates.

# Define our update function. We only look at `data` here as the data is already stored in the format we want
def update_fig(data, update):
    line.set_data([data["x"], data["y"]])

    # Resize and scale the axes. Our data may have expanded and we don't want it to appear off screen.
    ax.relim()
    ax.autoscale_view(True, True, True)


# Create our animation. It will listen for updates on `tt` and call `update_fig` whenever there is an update
ani = TableAnimation(fig, tt, update_fig)
```

### Scatter Plot

Scatter plots require data in a different format that Line plots, so need to pass in the data differently.

```python
import matplotlib.pyplot as plt
from deephaven import time_table
from deephaven.plugin.matplotlib import TableAnimation

tt = time_table("PT00:00:01").update(
    ["x=Math.random()", "y=Math.random()", "z=Math.random()*50"]
)

fig = plt.figure()
ax = fig.subplots()
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
scat = ax.scatter([], [])  # Provide empty data initially
scatter_offsets = []  # Store separate arrays for offsets and sizes
scatter_sizes = []


def update_fig(data, update):
    # This assumes that table is always increasing. Otherwise need to look at other
    # properties in update for creates and removed items
    added = update.added()
    for i in range(0, len(added["x"])):
        # Append new data to the sources
        scatter_offsets.append([added["x"][i], added["y"][i]])
        scatter_sizes.append(added["z"][i])

    # Update the figure
    scat.set_offsets(scatter_offsets)
    scat.set_sizes(scatter_sizes)


ani = TableAnimation(fig, tt, update_fig)
```

### Multiple Series

It's possible to have multiple kinds of series in the same figure. Here is an example driving a line and a scatter plot:

```python
import matplotlib.pyplot as plt
from deephaven import time_table
from deephaven.plugin.matplotlib import TableAnimation

tt = time_table("PT00:00:01").update(
    ["x=i", "y=Math.sin(x)", "z=Math.cos(x)", "r=Math.random()", "s=Math.random()*100"]
)

fig = plt.figure()
ax = fig.subplots()
(line1,) = ax.plot([], [])
(line2,) = ax.plot([], [])
scat = ax.scatter([], [])
scatter_offsets = []
scatter_sizes = []


def update_fig(data, update):
    line1.set_data([data["x"], data["y"]])
    line2.set_data([data["x"], data["z"]])
    added = update.added()
    for i in range(0, len(added["x"])):
        scatter_offsets.append([added["x"][i], added["r"][i]])
        scatter_sizes.append(added["s"][i])
    scat.set_offsets(scatter_offsets)
    scat.set_sizes(scatter_sizes)
    ax.relim()
    ax.autoscale_view(True, True, True)


ani = TableAnimation(fig, tt, update_fig)
```

## Build

To create your build / development environment (skip the first two lines if you already have a venv):

```sh
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools
pip install build deephaven-plugin matplotlib
```

To build:

```sh
python -m build --wheel
```

The wheel is stored in `dist/`.

To test within [deephaven-core](https://github.com/deephaven/deephaven-core), note where this wheel is stored (using `pwd`, for example).
Then, follow the directions in the top-level README.md to install the wheel into your Deephaven environment.
