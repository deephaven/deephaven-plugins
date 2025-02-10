# Choose the State Structure

Structuring state effectively can be the difference between a component that is easy to modify and debug, and one that is a persistent source of bugs. Here are some tips to consider when organizing state.

## Principles for structuring state

When you write a component that holds state, you will make choices about how many state variables to use and what the shape of their data should be. While it is possible to write correct programs even with a suboptimal state structure, there are a few principles that can help you to make better choices:

1. **Group related state.** If you always update two or more state variables at the same time, consider merging them into a single state variable.
2. **Avoid contradictions in state.** When the state is structured in a way that several pieces of state may contradict and “disagree” with each other, you leave room for mistakes. Try to avoid this.
3. **Avoid redundant state.** If you can calculate some information from the component’s props or its existing state variables during rendering, you should not put that information into that component’s state.
4. **Avoid duplication in state.** When the same data is duplicated between multiple state variables, or within nested objects, it is difficult to keep them in sync. Reduce duplication when you can.
5. **Avoid deeply nested state.** Deeply hierarchical state is not very convenient to update. When possible, prefer to structure state in a flat way.

The purpose of these principles is to simplify state updates and minimize errors. By eliminating redundant and duplicate data from the state, you can ensure consistency across all its pieces. This approach is akin to how a database engineer might "normalize" a database structure to minimize bugs.

## Group related state

At times, you may be uncertain whether to use a single state variable or multiple state variables.

Should you use this?

```python
start_date, set_start_date = ui.use_state("2020-02-03")
end_date, set_end_date = ui.use_state("2020-02-08")
```

Or should you use this?

```python
date_range, set_date_range = ui.use_state({"start": "2020-02-03", "end": "2020-02-08"})
```

You can use either approach, but if two state variables always change together, consider combining them into a single state variable.

```python
from deephaven import ui


@ui.component
def example():
    date_range, set_date_range = ui.use_state(
        {"start": "2020-02-03", "end": "2020-02-08"}
    )
    return ui.range_calendar(
        aria_label="Date range (controlled)", value=date_range, on_change=set_date_range
    )


my_example = example()
```

Grouping data into an object or array is useful when the number of state pieces is unknown. For instance, this approach is beneficial for forms where users can add custom fields.

When your state variable is an object, you must copy the other fields explicitly when updating a single field. For instance, using `set_date_range({ "start": "2020-02-03" })` in the example above would omit the `end` field. To update only x, use `set_date_range({ **date_range, "start": "2020-02-03" })` or separate them into two state variables and use `set_start("2020-02-03")`.

## Avoid contradictions in state

Here is a feedback form with `is_sending` and `is_sent` state variables:

```python
from deephaven import ui
import threading


@ui.component
def feedback_form():
    text, set_text = ui.use_state("")
    is_sending, set_is_sending = ui.use_state(False)
    is_sent, set_is_sent = ui.use_state(False)

    def finish_submit():
        set_is_sending(False)
        set_is_sent(True)

    def handle_submit():
        set_is_sending(True)
        threading.Timer(5, finish_submit).start()

    if is_sent:
        return ui.heading("Thanks for the feedback!")

    return ui.form(
        ui.text("Do you have any feedback?"),
        ui.text_area(value=text, on_change=set_text, is_disabled=is_sending),
        ui.button("Send", type="submit"),
        ui.text("Sending...") if is_sending else None,
        on_submit=handle_submit,
    )


feedback_form_example = feedback_form()
```

Although this code functions, it allows for "impossible" states. For instance, if you forget to call `set_is_sent` and `set_is_sending` together, you might end up with both `is_sending` and `is_sent` being `True` simultaneously. The more complex your component becomes, the harder it is to trace what went wrong.

Since `is_sending` and `is_sent` should never be `True` at the same time, it is better to replace them with a single status state variable that can take one of three valid states: `typing` (initial), `sending`, and `sent`:

```python
from deephaven import ui
import threading


@ui.component
def feedback_form():
    text, set_text = ui.use_state("")
    status, set_status = ui.use_state("typing")

    def finish_submit():
        set_status("sent")

    def handle_submit():
        set_status("sending")
        threading.Timer(5, finish_submit).start()

    is_sending = status == "sending"
    is_sent = status == "sent"

    if is_sent:
        return ui.heading("Thanks for the feedback!")

    return ui.form(
        ui.text("Do you have any feedback?"),
        ui.text_area(value=text, on_change=set_text, is_disabled=is_sending),
        ui.button("Send", type="submit"),
        ui.text("Sending...") if is_sending else None,
        on_submit=handle_submit,
    )


feedback_form_example = feedback_form()
```

You can still declare some constants for readability:

```python
is_sending = status == "sending"
is_sent = status == "sent"
```

But they are not state variables, so you do not need to worry about them getting out of sync with each other.

## Avoid redundant state

If you can derive some information from the component’s props or its existing state variables during rendering, you should avoid putting that information into the component’s state.

For instance, consider this form. It functions correctly, but there is state within it.

```python
from deephaven import ui


@ui.component
def name_input():
    first_name, set_first_name = ui.use_state("")
    last_name, set_last_name = ui.use_state("")
    full_name, set_full_name = ui.use_state("")

    def handle_first_name_change(value):
        set_first_name(value)
        set_full_name(f"{value} {last_name}")

    def handle_last_name_change(value):
        set_last_name(value)
        set_full_name(f"{first_name} {value}")

    return [
        ui.heading("Check in"),
        ui.text_field(
            label="First Name", value=first_name, on_change=handle_first_name_change
        ),
        ui.text_field(
            label="Last Name", value=last_name, on_change=handle_last_name_change
        ),
        ui.text(f"You are checking in: {full_name}"),
    ]


name_input_example = name_input()
```
