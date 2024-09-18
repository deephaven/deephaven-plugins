# Action Group

A action group is a UI component that groups multiple action buttons together. 

## Example

```python
from deephaven import ui


my_action_group_basic = ui.action_group(
    ui.action_button("Add"),
    ui.action_button("Edit"),
    ui.action_button("Delete"),
    label="Select an action",
)
```