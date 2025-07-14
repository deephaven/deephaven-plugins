# Calendar

Calendars display a grid of days in one or more months and allow users to select a single date.

## Example

```python
from deephaven import ui

my_calendar_basic = ui.calendar(aria_label="Event Date")
```

![Calendar Basic Example](../_assets/calendar_basic.png)

## Date types

The calendar accepts the following date types as inputs:

- `None`
- `LocalDate`
- `ZoneDateTime`
- `Instant`
- `int`
- `str`
- `datetime.datetime`
- `numpy.datetime64`
- `pandas.Timestamp`

The input will be converted to one of three Java date types:

1. `LocalDate`: A LocalDate is a date without a time zone in the ISO-8601 system, such as "2007-12-03" or "2057-01-28".
2. `Instant`: An Instant represents an unambiguous specific point on the timeline, such as 2021-04-12T14:13:07 UTC.
3. `ZonedDateTime`: A ZonedDateTime represents an unambiguous specific point on the timeline with an associated time zone, such as 2021-04-12T14:13:07 America/New_York.

The format of the calendar and the type of the value passed to the `on_change` handler
is determined by the type of the following props in order of precedence:

1. `value`
2. `default_value`
3. `focused_value`
4. `default_focused_value`

If none of these are provided, the `on_change` handler passes a range of `Instant`.

```python order=zoned_calendar,instant_calendar,local_calendar
from deephaven import ui
from deephaven.time import to_j_local_date, dh_today, to_j_instant, to_j_zdt

zoned_date_time = to_j_zdt("1995-03-22T11:11:11.23142 America/New_York")
instant = to_j_instant("2022-01-01T00:00:00 ET")
local_date = to_j_local_date(dh_today())


@ui.component
def calendar_test(value):
    date, set_date = ui.use_state(value)
    return [ui.calendar(on_change=set_date, value=date), ui.text(str(date))]


zoned_calendar = calendar_test(zoned_date_time)
instant_calendar = calendar_test(instant)
local_calendar = calendar_test(local_date)
```

## Value

A Calendar has no selection by default. An initial, uncontrolled value can be provided to the Calendar using the `default_value` prop. Alternatively, a controlled value can be provided using the `value` prop.

```python
from deephaven import ui


@ui.component
def example():
    value, set_value = ui.use_state("2020-02-03")
    return ui.flex(
        ui.calendar(
            aria_label="Calendar (uncontrolled)",
            default_value="2020-02-03",
        ),
        ui.calendar(
            aria_label="Calendar (controlled)", value=value, on_change=set_value
        ),
        gap="size-300",
        wrap=True,
    )


my_example = example()
```

## Labeling

An `aria_label` must be provided to the Calendar for accessibility. If it is labeled by a separate element, an `aria_labelledby` prop must be provided using the id of the labeling element instead.

## Events

Calendar accepts an `on_change` prop which is triggered whenever a date is selected by the user.

```python
from deephaven import ui


@ui.component
def event_example():
    value, set_value = ui.use_state("2020-02-03")
    return ui.calendar(
        aria_label="Calendar (controlled)", value=value, on_change=set_value
    )


my_event_example = event_example()
```

## Validation

By default, Calendar allows selecting any date. The `min_value` and `max_value` props can also be used to prevent the user from selecting dates outside a certain range.

This example only accepts dates after today.

```python
from deephaven import ui
from deephaven.time import dh_today


my_calendar_min_value_example = ui.calendar(
    aria_label="Appointment Date", min_value=dh_today()
)
```

## Controlling the focused date

By default, the selected date is focused when a Calendar first mounts. If no `value` or `default_value` prop is provided, then the current date is focused. However, Calendar supports controlling which date is focused using the `focused_value` and `on_focus_change` props. This also determines which month is visible. The `default_focused_value` prop allows setting the initial focused date when the Calendar first mounts, without controlling it.

This example focuses July 1, 2021 by default. The user may change the focused date, and the `on_focus_change` event updates the state. Clicking the button resets the focused date back to the initial value.

```python
from deephaven import ui
from deephaven.time import to_j_local_date

default_date = to_j_local_date("2021-07-01")


@ui.component
def focused_example():
    value, set_value = ui.use_state(default_date)
    return ui.flex(
        ui.action_button(
            "Reset focused date", on_press=lambda: set_value(default_date)
        ),
        ui.calendar(focused_value=value, on_focus_change=set_value),
        direction="column",
        align_items="start",
        gap="size-200",
    )


my_focused_example = focused_example()
```

## Disabled state

The `is_disabled` prop disables the calendar to prevent user interaction. This is useful when the calendar should be visible but not available for selection.

```python
from deephaven import ui


my_calendar_is_disabled_example = ui.calendar(
    is_disabled=True,
)
```

## Read only

The `is_read_only` prop makes the calendar's value immutable. Unlike `is_disabled`, the calendar remains focusable.

```python
from deephaven import ui


my_calendar_is_read_only_example = ui.calendar(
    is_read_only=True,
)
```

## Visible Months

By default, the Calendar displays a single month. The `visible_Months` prop allows displaying up to 3 months at a time.

```python
from deephaven import ui


my_calendar_visible_months_example = ui.calendar(
    visible_months=3,
)
```

## Page Behavior

By default, when pressing the next or previous buttons, pagination will advance by the `visible_months` value. This behavior can be changed to page by single months instead, by setting `page_behavior` to `single`.

```python
from deephaven import ui


my_calendar_page_behavior_example = ui.calendar(
    visible_months=3, page_behavior="single"
)
```

## Time table filtering

Calendars can be used to filter tables with time columns.

```python order=date_filter,_table
from deephaven.time import dh_now
from deephaven import time_table, ui


@ui.component
def date_table_filter(table, start_date, end_date, time_col="Timestamp"):
    after_date, set_after_date = ui.use_state(start_date)
    before_date, set_before_date = ui.use_state(end_date)
    return [
        ui.flex(
            ui.calendar(
                aria_label="Start Date", value=after_date, on_change=set_after_date
            ),
            ui.calendar(
                aria_label="End Date", value=before_date, on_change=set_before_date
            ),
        ),
        table.where(f"{time_col} >= after_date  && {time_col} < before_date"),
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
.. dhautofunction:: deephaven.ui.calendar
```
