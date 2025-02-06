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
