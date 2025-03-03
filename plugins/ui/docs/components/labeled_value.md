# Labeled Value

A labeled value displays a non-editable value with a label.

## Example

```python
from deephaven import ui


my_labeled_value_basic = ui.labeled_value(label="File name", value="Budget.xls")
```

## Value

A labeled value accepts numbers, dates, strings, and lists of strings in the `value` prop.

```python
from deephaven import ui
from deephaven.time import dh_today


@ui.component
def ui_labeled_value_examples():
    return [
        ui.labeled_value(label="File name", value="Budget.xls"),
        ui.labeled_value(label="Number of expenses in Budget file", value=123),
        ui.labeled_value(
            label="Pizza toppings", value=["Pizza", "Pineapple", "Mushroom", "Garlic"]
        ),
        ui.labeled_value(label="Today's date", value=dh_today()),
    ]


my_labeled_value_values_examples = ui_labeled_value_examples()
```

## Numbers

When passing a number into a labeled value, the `format_options` prop dictates how the value is displayed. There are 3 styles supported by this parameter: Percentage, Currency, and Units.

Note that this prop is compatible with the options of [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat).

```python
from deephaven import ui


@ui.component
def ui_labeled_value_numbers_example():
    return [
        ui.labeled_value(
            label="Percent completed",
            value=0.89,
            format_options={"style": "percent"},
        ),
        ui.labeled_value(
            label="Withdrawal amount",
            value=2350.50,
            format_options={"style": "currency", "currency": "USD"},
        ),
        ui.labeled_value(
            label="Height of Burj Khalifa",
            value=32600,
            format_options={"style": "unit", "unit": "inch"},
        ),
    ]


my_labeled_value_numbers_example = ui_labeled_value_numbers_example()
```

An object with a `start` and `end` property can be passed to the `value` prop in order to format a numeric range.

```python
from deephaven import ui

my_number_range = ui.labeled_value(
    label="Price range",
    value={"start": 150, "end": 400},
    format_options={"style": "currency", "currency": "USD", "minimumFractionDigits": 0},
)
```

## Dates and time

`ui.labeled_value` accepts the following date types as inputs:

- `None`
- `LocalDate`
- `ZonedDateTime`
- `Instant`
- `int`
- `str`
- `datetime.datetime`
- `numpy.datetime64`
- `pandas.Timestamp`

When passing a `int` or `str` into the `value` prop, `format_options` must be specified to indicate that it should be parsed as a date. See more about date formatting in the section below this one.

Note that the conversion methods, such as `to_j_instant()`, used in this example are to demonstrate the types that are accepted, and _should not_ be used, in favor of passing a date string directly to the component.

```python
from deephaven import ui
from deephaven.time import to_j_instant, to_j_zdt, to_j_local_date
import datetime


@ui.component
def labeled_value_datetime():
    instant = to_j_instant("2035-01-31T12:30:00.12345 UTC")
    zoned_date_time = to_j_zdt("2035-01-31T12:30:00.12345 America/New_York")
    local_date = to_j_local_date("2035-01-31")

    return [
        ui.labeled_value(label="Instant", value=instant),
        ui.labeled_value(
            label="Date string",
            value="2035-01-31T12:30:00.12345 UTC",
            format_options={"date_format": ""},
        ),
        ui.labeled_value(
            label="Python datetime",
            value=datetime.datetime(2035, 1, 31, 12, 30, 0, 12345),
        ),
        ui.labeled_value(label="Zoned date time", value=zoned_date_time),
        ui.labeled_value(label="Local date", value=local_date),
        ui.labeled_value(
            label="Nanoseconds",
            value=2053877400123450000,
            format_options={"date_format": "yyyy-MM-dd'T'HH:mm:SSSSSSSSS z"},
        ),
    ]


my_labeled_value_datetime = labeled_value_datetime()
```

By default, dates and times are formatted according to the user's locale. An empty string can be passed to when passing a `str` or `int` date value to indicate that this default formatting behavior should be used.

If more precision or another format is desired, datetime values can be formatted using the `format_options` property. To do so, pass an object with a `date_format` property string that follows [the GWT Java DateTimeFormat syntax](https://www.gwtproject.org/javadoc/latest/com/google/gwt/i18n/client/DateTimeFormat.html) with additional support for nanoseconds. You may provide up to 9 `S` characters after the decimal to represent partial seconds down to nanoseconds. Below are examples of patterns that can be used to format dates.

```python
from deephaven import ui
from deephaven.time import dh_now


@ui.component
def labeled_value_datetime_formatting():
    now = dh_now()

    return [
        ui.labeled_value(
            label="12-hr time", value=now, format_options={"date_format": "h:mm a"}
        ),
        ui.labeled_value(
            label="Day, abbreviated month, year",
            value=now,
            format_options={"date_format": "d MMM yyyy"},
        ),
        ui.labeled_value(
            label="Day of week, full month, day, year, 24-hr time",
            value=now,
            format_options={"date_format": "EEEE, MMMM dd, yyyy HH:mm:ss"},
        ),
        ui.labeled_value(
            label="Timestamp in nanoseconds",
            value=now,
            format_options={"date_format": "yyyy-MM-dd'T'HH:mm:SSSSSSSSS z"},
        ),
    ]


my_labeled_value_datetime_formatting = labeled_value_datetime_formatting()
```

By default, dates and times are displayed based on the timezone set in user settings. If the provided date is already timezone aware, such is the case with a `ZonedDateTime`, its timezone will be used. If a different timezone is desired, it can be overridden by passing a timezone code or abbreviation string to the `timezone` prop. See the [list of timezones supported by Deephaven](https://deephaven.io/core/client-api/javascript/classes/dh.i18n.TimeZone.html).

## Label position

By default, the label is positioned above the labeled value, but it can be moved to the side using the `label_position` prop.

```python
from deephaven import ui


my_labeled_value_label_position_example = ui.labeled_value(
    label="File name", value="Onboarding.pdf", label_position="side", label_align="end"
)
```

## Contextual Help

Using the `contextual_help` prop, a `ui.contextual_help` can be placed next to the labeled value to provide additional information.

```python
from deephaven import ui


my_labeled_value_contextual_help_example = ui.labeled_value(
    label="File name",
    value="Onboarding.pdf",
    contextual_help=ui.contextual_help(
        heading="Info about the onboarding document", content="Sample content"
    ),
)
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.labeled_value
```
