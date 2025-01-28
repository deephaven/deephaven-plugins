# Update Tables in State

As your `deephaven.ui` components become more complex, you may want to set a deephaven [table](../describing/ui_with_tables.md) as state for your component. This will allow you to create UIs where the underlying table changes in response to user events. However, it is important to keep in mind the [liveness scope](/core/docs/conceptual/liveness-scope-concept/) of a table when you set it in state.

For example, this component allows a user to reset a table by setting it in state:
