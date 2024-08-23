# Table

Tables are wrappers for Deephaven tables that allow you to change how the table is displayed in the UI and handle user events.

## Example

```python
from deephaven import ui, empty_table

_t = empty_table(10).update("X=i")
t = ui.table(_t)
```

## UI recommendations

1. It is not necessary to use a UI table if you do not need any of its properties. You can just use the Deephaven table directly.
2. Use a UI table to show properties like filters as if the user had created them in the UI. Users will be able to change the default values provided by the UI table such as filters.
3. UI tables handle ticking tables automatically, so you can pass any Deephaven table to a UI table.

## Events

## Context Menu Items

## Quick Filters

## Rearranging Columns

## Grouping columns

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.table
```
