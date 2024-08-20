# Radio Group

A radio group is a UI component that groups multiple radio buttons together, allowing users to select one option from a set of mutually exclusive choices. 

## Example

```python
from deephaven import ui


my_radio_group_basic = ui.radio_group(
    ui.radio("Dogs", value="dogs"), ui.radio("Cats", value="cats")
)
```
