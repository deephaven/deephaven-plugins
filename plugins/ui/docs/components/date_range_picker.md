# Date Range Picker

Date Range Pickers allow users to select a range Dates and Times from a pop up Calendar.

## Example

```python
from deephaven import ui

dp = ui.date_range_picker(
    label="Date Range Picker",
    default_value={
        "start": "2024-01-02T10:30:00 UTC",
        "end": "2024-01-05T10:30:00 UTC",
    },
    on_change=print,
)
```

## Date types

A date range picker that can be used to select range of dates.

The range is a dictionary with a `start` date and an `end` date. e.g. `{ "start": "2024-01-02", "end": "2024-01-05" }`

The date range picker accepts the following date types as inputs:  
`None`, `LocalDate`, `ZoneDateTime`, `Instant`, `int`, `str`, `datetime.datetime`, `numpy.datetime64`, `pandas.Timestamp`

The `start` and `end` dates should be input using the same type.

The input will be converted to one of three Java date types:

1. `LocalDate`: A LocalDate is a date without a time zone in the ISO-8601 system, such as "2007-12-03" or "2057-01-28".
   This will create a date range picker with a granularity of days.
2. `Instant`: An Instant represents an unambiguous specific point on the timeline, such as 2021-04-12T14:13:07 UTC.
   This will create a date range picker with a granularity of seconds in UTC. The time zone will be rendered as the time zone in user settings.
3. `ZonedDateTime`: A ZonedDateTime represents an unambiguous specific point on the timeline with an associated time zone, such as 2021-04-12T14:13:07 America/New_York.
   This will create a date range picker with a granularity of seconds in the specified time zone. The time zone will be rendered as the specified time zone.

The `start` and `end` inputs are coverted according to the following rules:

1. If the input is one of the three Java date types, use that type.
2. A date string such as "2007-12-03" will parse to a `LocalDate`
3. A string with a date, time, and timezone such as "2021-04-12T14:13:07 America/New_York" will parse to a `ZonedDateTime`
4. All other types will attempt to convert in this order: `Instant`, `ZonedDateTime`, `LocalDate`

The format of the date range picker and the type of the value passed to the `on_change` handler
is determined by the type of the following props in order of precedence:

1. `value`
2. `default_value`
3. `placeholder_value`

If none of these are provided, the `on_change` handler will be passed a range of `Instant`.

## Controlled mode with value

Setting the `value` prop will put the date_range_picker in controlled mode. Selecting new dateS will call the `on_change` callback.
Then `value` must be updated programatically to render the new value. This can be done using the `use_state` hook.

```python
from deephaven import ui
from deephaven.time import to_j_local_date, dh_today, to_j_instant, to_j_zdt

zdt_start = to_j_zdt("1995-03-22T11:11:11.23142 America/New_York")
zdt_end = to_j_zdt("1995-03-25T11:11:11.23142 America/New_York")
instant_start = to_j_instant("2022-01-01T00:00:00 ET")
instant_end = to_j_instant("2022-01-05T00:00:00 ET")
local_start = to_j_local_date("2024-05-06")
local_end = to_j_local_date("2024-05-10")


@ui.component
def date_range_picker_test(start, end):
    dates, set_dates = ui.use_state({"start": start, "end": end})
    return [ui.date_range_picker(on_change=set_dates, value=dates), ui.text(str(dates))]


zdt_drp = date_range_picker_test(zdt_start, zdt_end)
instant_drp = date_range_picker_test(instant_start, instant_end)
local_drp = date_range_picker_test(local_start, local_end)
```

## Uncontrolled mode with default_value

If the `value` prop is omitted, the date_range_picker will be in uncontrolled mode. It will store its state internally and automatically update when a new date is selected.
In this mode, setting the `default_value` prop will determine the initial value displayed by the date_range_picker.

```python
from deephaven.time import dh_now
from deephaven import ui

SECONDS_IN_DAY = 86400
today = dh_now()
dp = ui.date_range_picker(
    label="Date Range Picker",
    default_value={"start": today, "end": today.plusSeconds(SECONDS_IN_DAY * 5)},
    on_change=print,
)
```

## Uncontrolled mode with placeholder_value

If both `value` and `default_value` are omitted, the date_range_picker will be in uncontrolled mode displaying no date selected. When opened, the Date Range Picker will suggest the date from the `placeholder_value` prop.
Omitting `placeholder_value` will default it to today at the current time on the server machine time zone.

```python
from deephaven import ui

dp1 = ui.date_range_picker(
    label="Date Range Picker",
    placeholder_value="2022-10-01T08:30:00 ET",
    on_change=print,
)

dp2 = ui.date_range_picker(
    label="Date Range Picker",
    on_change=print,
)
```

## Events

Date Range Pickers accept a value to display and can trigger actions based on events such as setting state when changed. See the [API Reference](#api-reference) for a full list of available events.

## Variants

Date Range Pickers can have different variants to indicate their purpose.

```python
from deephaven import ui


@ui.component
def date_range_picker_variants():
    return [
        ui.date_range_picker(description="description"),
        ui.date_range_picker(error_message="error", validation_state="valid"),
        ui.date_range_picker(error_message="error", validation_state="invalid"),
        ui.date_range_picker(min_value="2024-01-01", max_value="2024-01-05"),
        ui.date_range_picker(
            value={
                "start": "2024-07-20T16:10:10 America/New_York",
                "end": "2024-07-27T16:10:10 America/New_York",
            },
            hour_cycle=24,
        ),
        ui.date_range_picker(granularity="YEAR"),
        ui.date_range_picker(granularity="MONTH"),
        ui.date_range_picker(granularity="DAY"),
        ui.date_range_picker(granularity="HOUR"),
        ui.date_range_picker(granularity="MINUTE"),
        ui.date_range_picker(granularity="SECOND"),
    ]


date_range_picker_variants_example = date_range_picker_variants()
```

## Time table filtering

Date Range Pickers can be used to filter tables with time columns.

```python
from deephaven.time import dh_now
from deephaven import time_table, ui


@ui.component
def date_table_filter(table, start_date, end_date, time_col="Timestamp"):
    dates, set_dates = ui.use_state({"start": start_date, "end": end_date})
    start = dates["start"]
    end = dates["end"]
    return [
        ui.date_range_picker(label="Dates", value=dates, on_change=set_dates),
        table.where(f"{time_col} >= start && {time_col} < end"),
    ]


SECONDS_IN_DAY = 86400
today = dh_now()
_table = time_table("PT1s").update_view(
    ["Timestamp=today.plusSeconds(SECONDS_IN_DAY*i)", "Row=i"]
)
date_filter = date_table_filter(_table, today, today.plusSeconds(SECONDS_IN_DAY * 10))
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.date_range_picker
```
