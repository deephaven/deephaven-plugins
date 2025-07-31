# URI

URIs are a way to reference Deephaven resources, such as tables or figures, from another instance. Deephaven UI has its own `ui.resolve` method that does not require any server to server communication. Instead, the web client will communicate directly with the appropriate server to get the resource.

## Usage

Deephaven UI provides a `resolve` method (not to be confused with `resolve` method from the Deephaven URI package) that allows you to reference Deephaven resources from other instances. Unlike the Deephaven URI package, `ui.resolve` does not resolve the URI to its resource on the server, so you cannot apply operations to the resource.

> [!NOTE]
> The only valid URIs for deephaven UI at the moment are for Deephaven Enterprise persistent queries.
> See the [Deephaven Enterprise documentation](/enterprise/docs/deephaven-database/remote-tables-python/#uris) for more information on persistent query URIs. The optional parameters are ignored by `ui.resolve`.

### Plain references

One way to use `ui.resolve` is to assign the reference to a variable which will be opened by the web UI just like you created the resource in the first place. This can be useful if you want to display tables from multiple sources in a single dashboard.

```py order=null
from deephaven import ui

t = ui.resolve("pq://MyPersistentQuery/scope/table") # Can't do t.update() or any other operations
p = ui.resolve("pq://MyPersistentQuery/scope/plot")


@ui.component
def basic_dashboard():
  return ui.panel(ui.flex(t, p), title="Table and Plot")


my_dashboard = ui.dashboard(basic_dashboard())
```

### Usage in UI components

Some Deephaven UI components that accept tables as sources can also accept URIs. This includes [`ui.table`](table.md) and any components that accept an `item_table_source`. When using a URI with UI components, you can often just use the string without needing to call `ui.resolve`. However, if a component may take a string as a valid child (e.g., `ui.picker`), then you must use `ui.resolve` to distinguish between a string and a URI. You can always use `ui.resolve` in the places you can use just the string if you prefer to be explicit.

> [!WARNING]
> Deephaven UI URIs cannot be used as table sources in the Deephaven Express plotting library.

```py order=null
from deephaven import ui

# You can use any ui.table props with a URI source
t = ui.table(
  "pq://MyPersistentQuery/scope/table",
  format_=ui.TableFormat(cols="A", background_color="salmon")
)

# Must use ui.resolve because string is a valid child
picker = ui.picker(
  ui.resolve("pq://MyPersistentQuery/scope/picker_table"),
  label="Picker Table"
)

list_view = ui.list_view(
  ui.item_table_source(
    "pq://MyPersistentQuery/scope/list_view_table",
    key_column="Keys",
    label_column="Labels"
  )
)
```

## URI Encoding

If your URI contains any special characters, such as spaces or slashes, you must encode the URI components using standard URL encoding. This is because URIs are often used in web contexts where special characters can cause issues. You can use Python's built-in `urllib.parse.quote` function to encode your URIs.

```py order=null
from urllib.parse import quote
from deephaven import ui

# Encode the URI
pq_name = quote("My PQ/with spaces!", safe="") # safe="" will encode the forward slash
t = ui.resolve(f"pq://{pq_name}/scope/table")
```
