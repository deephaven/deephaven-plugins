# Architecture

deephaven.ui is a flexible and extensible [React-like](https://react.dev/learn/thinking-in-react) UI framework that can create complex UIs in Python. You can create UIs using only the components provided by deephaven.ui, or you can create your own components using the `@ui.component` decorator.

## Components

Components are reusable pieces of UI that can be combined to create complex UIs. Each component defines its own logic and appearance. Components can be simple, like a button, or complex, like a table with controls for filtering and sorting. Components can also be composed of other components, allowing for complex UIs to be built up from simpler pieces.

Components are created using the `@ui.component` decorator. This decorator takes a function that returns a list of components, and returns a new function that can be called to render the component. The function returned by the decorator is called a "component function". Calling the function and assigning it to a variable will create an "element" that can be rendered by the client.

```python test-set=0
from deephaven import ui


@ui.component
def my_button():
    return ui.button("Click me!")


btn = my_button()
```

Once you have declared a component, you can nest it into another component.

```python test-set=0
@ui.component
def my_app():
    return ui.flex(ui.text("Hello, world!"), my_button(), direction="column")


app = my_app()
```

## Props

For almost all components, Python positional arguments are mapped to React children and keyword-only arguments are mapped to React props. Rarely, some arguments are positional and keyword. For example, in `contextual_help`, the footer argument is positional and keyword since it has a default of `None`. It will still be passed as a child.

```python order=my_prop_variations,footer_as_positional,footer_as_keyword
from deephaven import ui


my_prop_variations = ui.flex("Hello", "World", direction="column")
footer_as_positional = ui.contextual_help("Heading", "Content", "Footer")
footer_as_keyword = ui.contextual_help("Heading", "Content", footer="Footer")
```

The strings `"Hello"` and `"World"` will be passed to flex as a child, while `"column"` is passed as the value to the `direction` prop. `"Footer"` is passed as a child even if it's used in a keyword-manner. For more information, see the [`contextual_help`](./components/contextual_help.md) doc.

### Handling `null` vs `undefined`

Python has one nullish value (`None`) while JavaScript has two (`null` and `undefined`). In most cases, a distinction is not needed and `None` is mapped to `undefined`. However, for some props, such as `picker`'s `selected_value`, we differentiate between `null` and `undefined` with `None` and `ui.types.Undefined`, respectively. A list of props that need the distinction is passed through the `_nullable_props` parameter to `component_element`/`BaseElement`.

## Rendering

When you call a function decorated by `@ui.component`, it will return an `Element` object that references the function it is decorated by; that is to say, the function does _not_ run immediately. The function runs when the `Element` is rendered by the client, and the result is sent back to the client. This allows the `@ui.component` decorator to execute the function with the appropriate rendering context. The client must also set the initial state before rendering, allowing the client to persist the state and re-render in the future.

Let's say we execute the following, where a table is filtered based on the value of a text input:

```python order=tft,_stocks
from deephaven import ui
import deephaven.plot.express as dx


@ui.component
def text_filter_table(source, column, initial_value=""):
    value, set_value = ui.use_state(initial_value)
    ti = ui.text_field(value=value, on_change=set_value)
    tt = source.where(f"{column}=`{value}`")
    return [ti, tt]


# This will render two panels, one filtering the table by Sym, and the other by Exchange
@ui.component
def double_text_filter_table(source):
    tft1 = text_filter_table(source, "Sym", "CAT")
    tft2 = text_filter_table(source, "Exchange", "PETX")
    return ui.panel(tft1, title="Sym"), ui.panel(tft2, title="Exchange")


_stocks = dx.data.stocks()

tft = double_text_filter_table(_stocks)
```

This should result in a UI like:

![Double Text Filter Tables](_assets/double-tft.png)

How does that look when the notebook is executed? When does each code block execute?

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web UI
  participant UIP as UI Plugin
  participant C as Core
  participant SP as Server Plugin

  U->>W: Run notebook
  W->>C: Execute code
  C->>SP: is_type(object)
  SP-->>C: Matching plugin
  C-->>W: VariableChanges(added=[t, tft])

  W->>UIP: Open tft
  activate UIP
  UIP->>C: Fetch tft
  C-->>UIP: Export tft (Element)

  Note over UIP: UI knows about object tft<br/>double_text_filter_table not executed yet

  UIP->>SP: Render tft (initialState)
  SP->>SP: Run double_text_filter_table
  Note over SP: double_text_filter_table executes, running text_filter_table twice
  SP-->>UIP: Result (document=[panel(tft1), pane(tft2)], exported_objects=[tft1, tft2])
  UIP-->>W: Display Result
  deactivate UIP

  U->>UIP: Change text input 1
  activate UIP
  UIP->>SP: Change state
  SP->>SP: Run double_text_filter_table
  Note over SP: double_text_filter_table executes, text_filter_table only <br/>runs once for the one changed input<br/>only exports the new table, as client already has previous tables
  SP-->>UIP: Result (document=[panel(tft1'), panel(tft2)], <br/>state={}, exported_objects=[tft1'])
  UIP-->>W: Display Result
  deactivate UIP
```

### Threads and rendering

When a component is rendered, the render task is [submitted to the Deephaven server as a "concurrent" task](https://deephaven.io/core/pydoc/code/deephaven.server.executors.html#deephaven.server.executors.submit_task). This ensures that rendering one component does not block another component from rendering. A lock is then held on that component instance to ensure it can only be rendered by one thread at a time. After the lock is acquired, a root [render context](#render-context) is set in the thread-local data, and the component is rendered.

### Render context

Each component renders in its own render context, which helps keep track of state and side effects. While rendering components, "hooks" are used to manage state and other side effects. The magic part of hooks is they work based on the order they are called within a component. When a component is rendered, a new context is set, replacing the existing context. When the component is done rendering, the context is reset to the previous context. This allows for nested components to have their own state and side effects, and for the parent component to manage the state of the child components, re-using the same context when re-rendering a child component.

## Communication/Callbacks

When the document is first rendered, it will pass the entire document to the client. When the client makes a callback, it needs to send a message to the server indicating which callback it wants to trigger, and with which parameters. For this, we use [JSON-RPC](https://www.jsonrpc.org/specification). When the client opens the message stream to the server, the communication looks like:

```mermaid
sequenceDiagram
  participant UIP as UI Plugin
  participant SP as Server Plugin

    Note over UIP, SP: Uses JSON-RPC
  UIP->>SP: setState(initialState)
  SP-->>UIP: documentUpdated(Document, State)

  loop Callback
    UIP->>SP: foo(params)
    SP-->>UIP: foo result
    opt Update sent if callback modified state
    SP->>UIP: documentUpdated(Document, State)
    end
      Note over UIP: Client can store State to restore the same state later
  end
```

## Communication Layers

A component that is created on the server side runs through a few steps before it is rendered on the client side:

1. [Element](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/deephaven/ui/elements/Element.py) - The basis for all UI components. Generally, a [FunctionElement](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/deephaven/ui/elements/FunctionElement.py) created by a script using the [@ui.component](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/deephaven/ui/components/make_component.py) decorator that does not run the function until it is rendered. The result can change depending on the context that it is rendered in (e.g., what "state" is set).
2. [ElementMessageStream](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/deephaven/ui/object_types/ElementMessageStream.py) - The `ElementMessageStream` is responsible for rendering one instance of an element in a specific rendering context and handling the server-client communication. The element is rendered to create a [RenderedNode](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/deephaven/ui/renderer/RenderedNode.py), which is an immutable representation of a rendered document. The `RenderedNode` is then encoded into JSON using [NodeEncoder](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/deephaven/ui/renderer/NodeEncoder.py), which pulls out all the non-serializable objects (such as Tables) and maps them to exported objects, and all the callables to be mapped to commands that JSON-RPC can accept. This is the final representation of the document sent to the client and ultimately handled by the `WidgetHandler`.
3. [DashboardPlugin](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/js/src/DashboardPlugin.tsx) - Client-side `DashboardPlugin` that listens for when a widget of type `Element` is opened and manages the `WidgetHandler` instances that are created for each widget.
4. [WidgetHandler](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/js/src/WidgetHandler.tsx) - Uses JSON-RPC communication with an `ElementMessageStream` instance to set the initial state, then load the initial rendered document and associated exported objects. Listens for any changes and updates the document accordingly.
5. [DocumentHandler](https://github.com/deephaven/deephaven-plugins/blob/main/plugins/ui/src/js/src/DocumentHandler.tsx) - Handles the root of a rendered document, laying out the appropriate panels or dashboard specified.
