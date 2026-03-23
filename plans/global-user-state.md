# Plan for implementing a global user state in Deephaven UI

Proof of concept (not production):

```python
from deephaven import empty_table, ui


def create_store(initial_value=None):
    store_value = initial_value
    set_values = set()

    def use_store():
        value, set_value = ui.use_state(store_value)

        def add_set_value():
            set_values.add(set_value)

            # Clean up the set values when the component unmounts
            return lambda: set_values.discard(set_value)

        ui.use_effect(add_set_value, [set_value])

        def do_set_value(new_value):
            nonlocal store_value
            store_value = new_value
            for set_value in set_values:
                set_value(new_value)

        return value, do_set_value

    return use_store


use_value_store = create_store(0)


@ui.component
def my_slider():
    value, set_value = use_value_store()
    return ui.slider(label="Value", value=value, on_change=set_value)


@ui.component
def my_table():
    value, set_value = use_value_store()
    t = ui.use_memo(
        lambda: empty_table(1000).update(["x=i", f"y=x*Math.sin({value})"]), [value]
    )
    return t


s = my_slider()
t = my_table()
```

You can get user context:

```python
from deephaven_enterprise import auth_context
from deephaven import ui

query_user = auth_context.get_authenticated_user()
query_effective = auth_context.get_effective_user()


@ui.component
def ui_show_auth_context():
    component_user = auth_context.get_authenticated_user()
    component_effective = auth_context.get_effective_user()
    return [
        ui.heading(f"Query auth user: {query_user}"),
        ui.heading(f"Query effective user: {query_effective}"),
        ui.heading(f"Component auth user: {component_user}"),
        ui.heading(f"Component effective user: {component_effective}"),
    ]


auth = ui_show_auth_context()
```
