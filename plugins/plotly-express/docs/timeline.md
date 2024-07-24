# Timeline Plot

Timeline plots offer a way to visualize time-related data, displaying events, durations, or activities along a time axis. Developers can utilize these plots for applications that require users to understand temporal patterns and relationships, such as project management, event scheduling, and historical data analysis.

A timeline plot is appropriate when the data contain a categorical variable whose categories become relevant in different places across a timeline. An example may be the years that various members in a band have been active - some may have been active for the duration of the band's career, others may have only appeared in the early days and then left, some may have passed away and been replaced, and so on. Timeline plots are often used to display this data, such as [this timeline plot](https://en.wikipedia.org/wiki/Metallica#Timeline) detailing the member composition of the band Metallica throughout the years.

## Examples

### A basic timeline plot

Visualize the amount of time that each category in a column met a specific criteria.

```python order=jobs_tracking
import deephaven.plot.express as dx
jobs = dx.data.jobs()

# create a basic timeline plot by specifying the start time column, end time column, and y-value column
jobs_tracking = dx.timeline(jobs, x_start="StartTime", x_end="EndTime", y="Job")
```

### Color bars by a categorical variable

Use an additional categorical variable to color the bars.

```python order=jobs_tracking
import deephaven.plot.express as dx
jobs = dx.data.jobs()

# the `by` argument is used to color the bars by another categorical variable
jobs_resource_tracking = dx.timeline(jobs, x_start="StartTime", x_end="EndTime", y="Job", by="Resource")
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.timeline
```