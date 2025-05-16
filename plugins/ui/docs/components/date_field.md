# Date field

Date fields allow users to input a date using a text field.

## Example

```python
from deephaven import ui

my_date_field_basic = ui.date_field(label="Date field")
```

![Date Field Basic Example](../_assets/date_field_basic.png)

## Date types

A date field can be used to input a date.

The date field accepts the following date types as inputs:

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

1. `LocalDate`: in the ISO-8601 system, a LocalDate is a date without a time zone, such as "2007-12-03" or "2057-01-28".
   This will create a date field with a granularity of days.
2. `Instant`: An Instant represents an unambiguous specific point on the timeline, such as 2021-04-12T14:13:07 UTC.
   This will create a date field with a granularity of seconds in UTC. The time zone will be rendered as the time zone in user settings.
3. `ZonedDateTime`: A ZonedDateTime represents an unambiguous specific point on the timeline with an associated time zone, such as 2021-04-12T14:13:07 America/New_York.
   This will create a date field with a granularity of seconds in the specified time zone. The time zone will be rendered as the specified time zone.

The `start` and `end` inputs are converted according to the following rules:

1. If the input is one of the three Java date types, use that type.
2. A date string such as "2007-12-03" will parse to a `LocalDate`.
3. A string with a date, time, and time zone such as "2021-04-12T14:13:07 America/New_York" will parse to a `ZonedDateTime`
4. All other types will attempt to convert in this order: `Instant`, `ZonedDateTime`, `LocalDate`

The format of the date field and the type of the value passed to the `on_change` handler
are determined by the type of the following props in order of precedence:

1. `value`
2. `default_value`
3. `placeholder_value`

If none of these are provided, the `on_change` handler will be passed a field of `Instant`.

```python order=zoned_date_field,instant_date_field,local_date_field
from deephaven import ui
from deephaven.time import to_j_local_date, dh_today, to_j_instant, to_j_zdt

zoned_date_time = to_j_zdt("1995-03-22T11:11:11.23142 America/New_York")
instant = to_j_instant("2022-01-01T00:00:00 ET")
local_date = to_j_local_date(dh_today())


@ui.component
def date_field_test(value):
    date, set_date = ui.use_state(value)
    return [ui.date_field(on_change=set_date, value=date), ui.text(str(date))]


zoned_date_field = date_field_test(zoned_date_time)
instant_date_field = date_field_test(instant)
local_date_field = date_field_test(local_date)
```

## Value

A date field displays a `placeholder` by default. An initial, uncontrolled value can be provided to the date field using the `defaultValue` prop. Alternatively, a controlled value can be provided using the `value` prop.

```python
from deephaven import ui


@ui.component
def example():
    value, set_value = ui.use_state("2020-02-03")
    return ui.flex(
        ui.date_field(
            label="Date field (uncontrolled)",
            default_value="2020-02-03",
        ),
        ui.date_field(
            label="Date field (controlled)", value=value, on_change=set_value
        ),
        gap="size-150",
        wrap=True,
    )


my_example = example()
```

## Time zones

Date field is time zone aware when `ZonedDateTime` or `Instant` objects are provided as the value. In this case, the time zone abbreviation is displayed, and time zone concerns such as daylight saving time are taken into account when the value is manipulated.

In most cases, your data will come from and be sent to a server as an `ISO 8601` formatted string.

For `ZonedDateTime` objects, the date field will display the specified time zone.

For `Instant` objects, the date field will display the time zone from the user settings.

```python order=my_zoned_date_time,my_instant
from deephaven import ui
from deephaven.time import to_j_instant

my_zoned_date_time = ui.date_field(
    label="Date field",
    default_value="2022-11-07T00:45 America/Los_Angeles",
)

my_instant = ui.date_field(
    label="Date field",
    default_value=to_j_instant("2022-11-07T00:45Z"),
)
```

## Granularity

The `granularity` prop allows you to control the smallest unit that is displayed by a date field . By default, `LocalDate` values are displayed with "DAY" granularity (year, month, and day), and `ZonedDateTime` and `Instant` values are displayed with "SECOND" granularity.

In addition, when a value with a time is provided but you wish to display only the date, you can set the granularity to "DAY". This has no effect on the actual value (it still has a time component), only on what fields are displayed. In the following example, two date fields are synchronized with the same value but display different granularities.

```python
from deephaven import ui


@ui.component
def granularity_example():
    value, set_value = ui.use_state("2021-04-07T18:45:22 UTC")
    return ui.flex(
        ui.date_field(
            label="Date field and time field",
            granularity="SECOND",
            value=value,
            on_change=set_value,
        ),
        ui.date_field(
            label="Date field", granularity="DAY", value=value, on_change=set_value
        ),
        gap="size-150",
        wrap=True,
    )


my_granularity_example = granularity_example()
```

## HTML forms

Date field supports the `name` prop for integration with HTML forms. The values will be submitted to the server as `ISO 8601` formatted strings according to the granularity of the value. For example, if the date field allows selecting only dates, then strings such as "2023-02-03" will be submitted, and if it allows selecting times, then strings such as "2023-02-03T08:45:00".

```python
from deephaven import ui

my_date_field_forms = ui.form(
    ui.date_field(label="Birth date", name="birthday"),
    ui.button("Submit", type="submit"),
    on_submit=print,
)
```

## Labeling

A visual label should be provided for the date field using the `label` prop. If the date field is required, the `is_required` and `necessity_indicator` props can be used to show a required state.

```python
from deephaven import ui

my_date_field_labeling = ui.flex(
    ui.date_field(label="Date field"),
    ui.date_field(label="Date field", is_required=True, necessity_indicator="icon"),
    ui.date_field(label="Date field", is_required=True, necessity_indicator="label"),
    ui.date_field(label="Date field", necessity_indicator="label"),
)
```

## Events

Date fields support selection through mouse, keyboard, and touch inputs via the `on_change` prop, which receives the value as an argument.

```python
from deephaven import ui


@ui.component
def event_example():
    value, set_value = ui.use_state("2020-02-03")
    return ui.date_field(
        label="Date field (controlled)", value=value, on_change=set_value
    )


my_event_example = event_example()
```

## Validation

The `is_required` prop ensures that the user selects a date field. The related `validation_behaviour` prop allows the user to specify aria or native verification.

When the prop is set to "native", the validation errors block form submission and are displayed as help text automatically.

```python
from deephaven import ui


@ui.component
def date_field_validation_behaviour_example():
    return ui.form(
        ui.date_field(
            validation_behavior="native",
            is_required=True,
        )
    )


my_date_field_validation_behaviour_example = date_field_validation_behaviour_example()
```

## Minimum and maximum values

The `min_value` and `max_value` props can also be used to ensure the value is within a specific field. Date field also validates that the end date is after the start date.

```python
from deephaven import ui

my_date_field_basic = ui.date_field(
    label="Date field",
    min_value="2024-01-01",
    default_value="2022-02-03",
)
```

## Label position

By default, the position of a date field's label is above the date field , but it can be moved to the side using the `label_position` prop.

```python
from deephaven import ui


@ui.component
def date_field_label_position_examples():
    return [
        ui.date_field(
            label="Test Label",
        ),
        ui.date_field(
            label="Test Label",
            label_position="side",
        ),
    ]


my_date_field_label_position_examples = date_field_label_position_examples()
```

## Quiet state

The `is_quiet` prop makes a date field "quiet". This can be useful when its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


my_date_field_is_quiet_example = ui.date_field(
    is_quiet=True,
)
```

## Disabled state

The `is_disabled` prop disables the date field to prevent user interaction. This is useful when the date field should be visible but not available for selection.

```python
from deephaven import ui


my_date_field_is_disabled_example = ui.date_field(
    is_disabled=True,
)
```

## Read only

The `is_read_only` prop makes the date field's value immutable. Unlike `is_disabled`, the date field remains focusable.

```python
from deephaven import ui


my_date_field_is_read_only_example = ui.date_field(
    is_read_only=True,
)
```

## Help text

A date field can have both a `description` and an `error_message`. Use the error message to offer specific guidance on how to correct the input.

The `validation_state` prop can be used to set whether the current date field state is `valid` or `invalid`.

```python
from deephaven import ui


@ui.component
def date_field_help_text_examples():
    return [
        ui.date_field(
            label="Sample Label",
            description="Enter a date field.",
        ),
        ui.date_field(
            label="Sample Label",
            validation_state="valid",
            error_message="Sample invalid error message.",
        ),
        ui.date_field(
            label="Sample Label",
            validation_state="invalid",
            error_message="Sample invalid error message.",
        ),
    ]


my_date_field_help_text_examples = date_field_help_text_examples()
```

## Contextual help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the label to provide additional information about the date field.

```python
from deephaven import ui


date_field_contextual_help_example = ui.date_field(
    label="Sample Label",
    contextual_help=ui.contextual_help(
        ui.heading("Content tips"), ui.content("Help content")
    ),
)
```

## Custom width

The `width` prop adjusts the width of a date field, and the `max_width` prop enforces a maximum width.

```python
from deephaven import ui


@ui.component
def date_field_width_examples():
    return [
        ui.date_field(
            width="size-3600",
        ),
        ui.date_field(
            width="size-3600",
            max_width="100%",
        ),
    ]


my_date_field_width_examples = date_field_width_examples()
```

## Hide time zone

The time zone can be hidden using the `hide_time_zone` option.

```python
from deephaven import ui

my_hide_time_zone_example = ui.date_field(
    label="Date field",
    default_value="2022-11-07T00:45 America/Los_Angeles",
    hide_time_zone=True,
)
```

## Hour cycle

By default, date field displays times in either a `12` or `24` hour format depending on the user's locale. However, this can be overridden using the `hour_cycle` prop.

```python
from deephaven import ui


date_field_hour_cycle_example = ui.date_field(label="Date field", hour_cycle=24)
```

## Time table filtering

Date fields can be used to filter tables with time columns.

```python order=date_filter,_table
from deephaven.time import dh_now
from deephaven import time_table, ui


@ui.component
def date_table_filter(table, start_date, end_date, time_col="Timestamp"):
    after_date, set_after_date = ui.use_state(start_date)
    before_date, set_before_date = ui.use_state(end_date)
    return [
        ui.date_field(label="Start Date", value=after_date, on_change=set_after_date),
        ui.date_field(label="End Date", value=before_date, on_change=set_before_date),
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
.. dhautofunction:: deephaven.ui.date_field
```
