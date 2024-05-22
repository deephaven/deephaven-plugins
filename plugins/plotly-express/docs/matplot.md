---
id: matplot
title: How to use Matplotlib
sidebar_label: Use Matplotlib
---

This guide shows you how to use [Matplotlib](https://matplotlib.org/) to create plots in Deephaven.

By default, Deephaven does not come with Matplotlib, so you can either use our [Deephaven+Matplotlib base repository](https://github.com/deephaven-examples/deephaven-matplotlib-base) or extend the Deephaven Dockerized set up. Both options are documented below.

## Quickstart

To get up and running with Matplotlib, clone the [Deephaven+Matplotlib base repo](https://github.com/deephaven-examples/deephaven-matplotlib-base), enter its directory, and then run `docker compose up -d ` as usual:

```shell
git clone https://github.com/deephaven-examples/deephaven-matplotlib-base.git
cd deephaven-matplotlib-base
docker compose pull
docker compose up  --build -d
```

This starts the Deephaven IDE with all the needed packages.

Now, you're ready to use these plotting libraries. Open the [IDE](http://localhost:10000/ide) and get plotting!

## Extend Deephaven

If instead you wish to extend the Deephaven build, start by following the tutorial to [Launch Deephaven from pre-built images](../../tutorials/docker-install.md).

Once you've completed the steps in the tutorial, you can extend Deephaven. The Deephaven deployment typically only comes with a `docker-compose.yml` file. This file will need one modification to the following code block:

```yaml
services:
  deephaven:
    image: ghcr.io/deephaven/server:latest
```

This needs to be changed to:

```yaml
services:
  deephaven:
    build: ./server
```

Once that's done, you'll need to create a new directory called `server`, from which `docker compose` will build the necessary Docker image and dependencies.

```shell
mkdir server
cd server
```

The `server` folder will contain a `Dockerfile`. The `Dockerfile` defines how the Deephaven server image will be extended for matplotlib support.

Here's what `Dockerfile` should look like:

```
# syntax=docker/dockerfile:1.4

FROM ghcr.io/deephaven/web-plugin-packager:latest as build
RUN ./pack-plugins.sh @deephaven/js-plugin-matplotlib

FROM ghcr.io/deephaven/server:latest
RUN pip install --no-cache-dir deephaven-plugin-matplotlib matplotlib
COPY --link --from=build js-plugins /opt/deephaven/config/js-plugins/
```

Everything's ready to go! The following shell commands will spin up Deephaven with matplotlib support:

```shell
cd ..
docker compose up --build
```

## Matplotlib examples

:::caution

All examples in this guide use [Matplotlib's explicit interface](https://matplotlib.org/stable/users/explain/figure/api_interfaces.html#api-interfaces). Users should do the same, especially in examples where multiple plots source data from ticking tables.

:::

Here is the basic usage of Matplotlib to show one figure:

```python skip-test
import matplotlib.pyplot as plt


x = [0, 2, 4, 6]
y = [1, 3, 4, 8]
m_figure, m_axes = plt.subplots()
plt.plot(x, y)
plt.xlabel('x values')
plt.ylabel('y values')
plt.title('plotted x and y values')
plt.legend(['line 1'])
```

![img](../../assets/how-to/matplot/plot.png)

The full functionality of Matplotlib is avilable inside the Deephaven IDE:

```python skip-test
import matplotlib.pyplot as plt
import numpy as np
import math

# Get the angles from 0 to 2 pie (360 degree) in narray object
X = np.arange(0, math.pi*2, 0.05)

# Using built-in trigonometric function we can directly plot
# the given cosine wave for the given angles
Y1 = np.sin(X)
Y2 = np.cos(X)
Y3 = np.tan(X)
Y4 = np.tanh(X)

# Initialise the subplot function using number of rows and columns
figure, axis = plt.subplots(2, 2)

# For Sine Function
axis[0, 0].plot(X, Y1)
axis[0, 0].set_title("Sine Function")

# For Cosine Function
axis[0, 1].plot(X, Y2)
axis[0, 1].set_title("Cosine Function")

# For Tangent Function
axis[1, 0].plot(X, Y3)
axis[1, 0].set_title("Tangent Function")

# For Tanh Function
axis[1, 1].plot(X, Y4)
axis[1, 1].set_title("Tanh Function")
```

![img](../../assets/how-to/matplot/stacked_plot.png)

Here are some 3D examples from [Rashida Nasrin Sucky](https://towardsdatascience.com/five-advanced-plots-in-python-matplotlib-134bfdaeeb86). The data, available from [Kaggle](https://www.kaggle.com/fazilbtopal/auto85), needs to be placed in the data directory. For more information see our guide on [Docker data volumes](https://deephaven.io/core/docs/conceptual/docker-data-volumes/#the-data-mount-point).

```python skip-test
import pandas as pd
import numpy as np
from mpl_toolkits import mplot3d
import matplotlib.pyplot as plt


df = pd.read_csv("/data/auto_clean.csv")

fig = plt.figure(figsize=(10, 10))
ax = plt.axes(projection="3d")
ax.scatter3D(df['length'], df['width'], df['height'],
             c = df['peak-rpm'], s = df['price']/50, alpha = 0.4)
ax.set_xlabel("Length")
ax.set_ylabel("Width")
ax.set_zlabel("Height")
ax.set_title("Relationship between height, weight, and length")
```

![img](../../assets/how-to/matplot/scatter.png)

```python skip-test
df['body-style'].unique()

df['body_style1'] = df['body-style'].replace({"convertible": 1,
                                             "hatchback": 2,
                                             "sedan": 3,
                                             "wagon": 4,
                                             "hardtop": 5})

gr = df.groupby("body_style1")[['peak-rpm', 'price']].agg('mean')
x = gr.index
y = gr['peak-rpm']
z = [0]*5
colors = ["b", "g", "crimson", 'r', 'pink']
dx = 0.3 * np.ones_like(z)
dy = [30]*5
dz = gr['price']
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection="3d")
ax.set_xticklabels(['convertible', 'hatchback', 'sedan', 'wagon', 'hardtop'])
ax.set_xlabel("Body Style", labelpad = 7)
ax.set_yticks(np.linspace(5000, 5250, 6))
ax.set_ylabel("Peak Rpm", labelpad=10)
ax.set_zlabel("Price")
ax.set_zticks(np.linspace(7000, 22250, 6))
ax.set_title("Change of Price with Body_style and Peak RPM")
ax.bar3d(x, y, z, dx, dy, dz)
```

![img](../../assets/how-to/matplot/3d_bar.png)

```python skip-test
def z_function(x, y):
    return np.sin(np.sqrt(x**2 + y**2))

tri_surf = plt.figure(figsize=(8, 8))
ax = plt.axes(projection="3d")
x = df['peak-rpm']
y = df['city-mpg']
z = z_function(x, y)
ax.plot_trisurf(x, y, z,
                cmap='viridis', edgecolor='none');
ax.set_xlabel("Peak RPM")
ax.set_ylabel("City-MPG")
ax.set_title("Peak RPM vs City-MPG")
ax.view_init(60, 25)
```

![img](../../assets/how-to/matplot/tri_surf.png)

## Matplotlib examples with TableAnimation

[Deephaven's matplotlib plug-in](https://pypi.org/project/deephaven-plugin-matplotlib/) also enables you to visualize real-time data.

To install the plug-in, run:

```
pip install deephaven-plugin-matplotlib
```

Making a live animation requires two imports:

```python skip-test
from deephaven.plugin.matplotlib import TableAnimation
import matplotlib.pyplot as plt
```

The `TableAnimation` class will re-draw a plot every time a ticking table is updated. It needs three inputs:

1. The figure containing data (in the examples below, it's `fig`).
2. The table containing data (in the examples below, it's `tt` or `tt_sorted_top`).
3. The function defining how the plot is animated (`update_fig`).

See the examples below.

### Line plot

```python skip-test
import matplotlib.pyplot as plt
from deephaven import time_table
from deephaven.plugin.matplotlib import TableAnimation

# Create a ticking table with the sin function
tt = time_table("PT1S").update(["x=i", "y=Math.sin(x)"])

fig = plt.figure()      # Create a new figure
ax = fig.subplots()     # Add an axes to the figure
line, = ax.plot([],[])  # Plot a line. Start with empty data, will get updated with table updates.

# Define our update function. We only look at `data` here as the data is already stored in the format we want
def update_fig(data, update):
    line.set_data([data['x'], data['y']])

    # Resize and scale the axes. Our data may have expanded and we don't want it to appear off screen.
    ax.relim()
    ax.autoscale_view(True, True, True)

# Create our animation. It will listen for updates on `tt` and call `update_fig` whenever there is an update
ani = TableAnimation(fig, tt, update_fig)
```

![img](../../assets/how-to/real_time_line_chart.gif)

### Bar plot

```python skip-test
import matplotlib.pyplot as plt
from deephaven import time_table
from deephaven.plugin.matplotlib import TableAnimation
from deephaven import SortDirection

top_n = 5
# Create a ticking table with the linear function y = x
tt = time_table("PT1S").update(["x=i", "y=i"])
tt_sorted = tt.sort(order_by=["y"], order=[SortDirection.DESCENDING])
# Create a table with 5 largest values for the chart
tt_sorted_top = tt_sorted.head(top_n)

fig, ax = plt.subplots()
rects = ax.bar(range(top_n), [0] * top_n)
def update_fig(data, update):
    # update heights of the columns
    for rect, h in zip(rects, data["y"]):
        rect.set_height(h)
    # update labels
    ax.set_xticklabels(data["x"])
    ax.relim()
    ax.autoscale_view(True, True, True)
bar_plot_ani = TableAnimation(fig, tt_sorted_top, update_fig)
```

![img](../../assets/how-to/real_time_column_chart.gif)

### Scatter plot

Scatter plots require data in a different format than line plots, so we need to pass in the data differently:

```python skip-test
import matplotlib.pyplot as plt
from deephaven import time_table
from deephaven.plugin.matplotlib import TableAnimation

tt = time_table("PT1S").update(["x=Math.random()", "y=Math.random()", "z=Math.random()*50"])

fig = plt.figure()
ax = fig.subplots()
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
scat = ax.scatter([],[])    # Provide empty data initially
scatter_offsets = []        # Store separate arrays for offsets and sizes
scatter_sizes = []

def update_fig(data, update):
    # This assumes that table is always increasing. Otherwise need to look at other
    # properties in update for creates and removed items
    added = update.added()
    for i in range(0, len(added['x'])):
        # Append new data to the sources
        scatter_offsets.append([added['x'][i], added['y'][i]])
        scatter_sizes.append(added['z'][i])

    # Update the figure
    scat.set_offsets(scatter_offsets)
    scat.set_sizes(scatter_sizes)

ani = TableAnimation(fig, tt, update_fig)
```

![img](../../assets/how-to/real_time_scatter.gif)

### Multiple series

It's possible to have multiple kinds of series in the same figure. Here is an example of a line and a scatter plot:

```python skip-test
import matplotlib.pyplot as plt
from deephaven import time_table
from deephaven.plugin.matplotlib import TableAnimation

tt = time_table("PT1S").update(["x=i", "y=Math.sin(x)", "z=Math.cos(x)", "r=Math.random()", "s=Math.random()*100"])

fig = plt.figure()
ax = fig.subplots()
line1, = ax.plot([],[])
line2, = ax.plot([],[])
scat = ax.scatter([], [])
scatter_offsets = []
scatter_sizes = []

def update_fig(data, update):
    line1.set_data([data['x'], data['y']])
    line2.set_data([data['x'], data['z']])
    added = update.added()
    for i in range(0, len(added['x'])):
        scatter_offsets.append([added['x'][i], added['r'][i]])
        scatter_sizes.append(added['s'][i])
    scat.set_offsets(scatter_offsets)
    scat.set_sizes(scatter_sizes)
    ax.relim()
    ax.autoscale_view(True, True, True)

ani = TableAnimation(fig, tt, update_fig)
```

![img](../../assets/how-to/real_time_multiple_series.gif)

## Related documentation

- [How to use Seaborn](./seaborn.md)
- [How to use the Chart Builder](../user-interface/chart-builder.md)
- [How to use plug-ins](../use-plugins.md)
- [Arrays](../../reference/query-language/types/arrays.md)
