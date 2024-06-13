# Timeline Plot

Timeline plots in offer a means to visualize time-related data, displaying events, durations, or activities along a time axis. Developers can utilize these plots for applications that require users to understand temporal patterns and relationships, such as project management, event scheduling, and historical data analysis.

## Examples

### A basic timeline plot

Visualize the amount of time that each category in a column met a specific criteria.

:::note
This timeline plot example uses complex Deephaven operations to produce a table fit for the plot type. You will need to execute the collapsed code block to run this example.
:::

<details>
  <summary>Timeline table creation</summary>
  
    ```python test-set=1 order=null
    import deephaven.plot.express as dx
    from deephaven import agg
    from deephaven import updateby as uby
    gapminder = dx.data.gapminder() # import a ticking version of the Gapminder dataset

    # compute average GDP per continent per year, then compute year-over-year absolute change in GDP per continent
    continent_gdp_delta = (
        gapminder
        .view(["continent", "year", "month", "gdpPercap"])
        .agg_by(agg.avg("avgGdpPercap = gdpPercap"), by=["continent", "year"])
        .update_by(uby.delta("avgGdpPercapDelta = avgGdpPercap"), by="continent")
    )

    # compute year-over-year percent change in GDP per continent, then get the continent with largest percent growth per year
    largest_gdp_growth = (
        continent_gdp_delta
        .join(
            continent_gdp_delta.update_view("year = year + 1"),
            on=["year", "continent"], joins="prevAvgGdpPercap = avgGdpPercap")
        .update_view("pctAvgGdpPercapChange = avgGdpPercapDelta / prevAvgGdpPercap")
        .sort(["year", "pctAvgGdpPercapChange"])
        .last_by("year")
        .view(["year", "largestGrowth = continent"])
    )

    # create indicator column for whether the growth leader changes
    growth_leaders = (
        largest_gdp_growth
        .natural_join(
            largest_gdp_growth.update_view("year = year + 1"),
            on="year", joins="prevLargestGrowth = largestGrowth")
        .update_view([
            "growthLeaderChange = (year == 1953) || largestGrowth != prevLargestGrowth ? true : false",
        ])
    )

    # create start_time and end_time columns for when each continent dropped in and out of the leader spot
    timeline_table = (
        merge([
            growth_leaders.where("growthLeaderChange == true"),
            growth_leaders.tail(1)
        ])
        .update_by(uby.rolling_group_tick("yearChange = year", rev_ticks=1, fwd_ticks=1))
        .where("yearChange.size() == 2")
        .update_view("yearsLeading = yearChange[1] - yearChange[0]")
        .update_view([
            "startYear = toInstant(LocalDate.of((int)year, 1, 1), '00:00:00', 'UTC')",
            "endYear = toInstant(LocalDate.of((int)(year + yearsLeading), 1, 1), '00:00:00', 'UTC')"
        ])
        .view(["largestGrowth", "startYear", "endYear"])
    )
    ```
</details>

```python test-set=1 order=largest_gdp_growth_plot
import deephaven.plot.express as dx

# create a timeline plot using the table created above
largest_gdp_growth_plot = dx.timeline(timeline_table, x_start="startYear", x_end="endYear", y="largestGrowth")
```