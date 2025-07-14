# Timeline Plot

Timeline plots offer a way to visualize time-related data, displaying events, durations, or activities along a time axis. Developers can utilize these plots for applications that require users to understand temporal patterns and relationships, such as project management, event scheduling, and historical data analysis.

A timeline plot is appropriate when the data contain a categorical variable whose categories become relevant in different places across a timeline. An example may be the years that various members in a band have been active - some may have been active for the duration of the band's career, others may have only appeared in the early days and then left, some may have passed away and been replaced, and so on. Timeline plots are often used to display this data, such as [this timeline plot](https://en.wikipedia.org/wiki/Metallica#Timeline) detailing the member composition of the band Metallica throughout the years.

## Examples

### A basic timeline plot

Visualize the amount of time that each category in a column met a specific criteria. Pass the start and end timestamp column names to the `x_start` and `x_end` arguments, and category column name to the `y` argument.

```python order=timeline_plot,jobs
import deephaven.plot.express as dx
jobs = dx.data.jobs()

timeline_plot = dx.timeline(jobs, x_start="StartTime", x_end="EndTime", y="Job")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.timeline
```
