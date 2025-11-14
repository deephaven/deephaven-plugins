# Creating a `deephaven.ui` Element Plugin

This guide walks you end‑to‑end through building, packaging, and using a custom element plugin that adds a new `ui.component` to Deephaven. It uses a Cookiecutter template available at `templates/element/` in the [plugins source](https://github.com/deephaven/deephaven-plugins).

## What Is An Element Plugin?

An element plugin extends the Deephaven UI runtime with one or more custom visual elements. You author:

- Python components (decorated with `@ui.component`) that return `ui.BaseElement` – the server representation.
- A JavaScript (React) implementation mapped by name, bundled and delivered to the browser.
- A registration class that Deephaven discovers to load both Python and JavaScript portions.

## High‑Level Flow

1. Generate a project from the Cookiecutter template.
2. Fill in Python component logic (returning a `ui.BaseElement`).
3. Implement the React view and mapping in JS/TS.
4. Register the plugin (Python `Registration` class + JS element plugin object).
5. Build & install: Python package (wheel) + JavaScript bundle.
6. Launch Deephaven or import in a session and use your component.

## Prerequisites

Install or have available:

- Python 3.10+ (matches Deephaven server version you run)
- Node.js (recommended: LTS 18+)
- `cookiecutter` (`pip install cookiecutter`)
- A Deephaven environment (Docker compose, or server) where you can mount/install the plugin
- (Optional) A virtual environment for isolation

## Template Inputs

The file `templates/element/cookiecutter.json` defines variables. Key ones:

| Variable                  | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `python_project_name`     | Root Python package / distribution name            |
| `__component_name`        | Python component function name                     |
| `__element_name`          | String key returned in `ui.BaseElement(name, ...)` |
| `javascript_project_name` | Name of JS plugin (shown in plugin registry)       |
| `__js_plugin_obj`         | Exported TS constant for plugin object             |
| `__js_plugin_view_obj`    | React component name implementing the view         |
| `__registration_name`     | Python `Registration` subclass name                |
| `__py_namespace`          | Namespace under which the JS plugin is registered  |

These identifiers must stay consistent across Python and JS code (see mapping section below).

## Generate Your Plugin Project

From a directory where the `templates/element` Cookiecutter template is available (for example, a local plugins source checkout):

```bash
cookiecutter templates/element
```

Example answers (build a "Hello" element):

```
python_project_name: hello_element
__component_name: hello_element
__element_name: hello_element
javascript_project_name: hello-element
__js_plugin_obj: helloElementPlugin
__js_plugin_view_obj: HelloElementView
__js_plugin_view_obj_style: helloElementStyle
__registration_name: HelloElementRegistration
__py_namespace: hello_element
```

Resulting structure (simplified):

```
hello_element/
  pyproject.toml
  requirements.txt
  src/hello_element/
    hello_element.py
    register.py
    js/
      package.json
      src/
        helloElementPlugin.ts
        HelloElementView.tsx
        index.ts
```

## Python Component

Edit `src/hello_element/hello_element.py` (generated similar to template):

```python
from deephaven import ui
from typing import Callable


@ui.component
def hello_element(
    text: str = "Hello, Deephaven!", on_click: Callable = print
) -> ui.BaseElement:
    """Simple example element that echoes user input back to the server."""
    props = locals()  # capture current arg values
    return ui.BaseElement("hello_element", **props)
```

Contract:

- Inputs: `text` string, `on_click` callback invoked from JS.
- Output: `ui.BaseElement(name, **props)` – `name` MUST match mapping key in the JS plugin.
- Error modes: If callback fails, exception propagates server‑side; optionally wrap in try/except if you want user messaging.

## Python Registration

`register.py` wires the JS bundle (built later) into Deephaven:

```python
from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper

PACKAGE_NAMESPACE = "hello_element"
JS_NAME = "_js"  # must match setup metadata


class HelloElementRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        safe = DheSafeCallbackWrapper(callback)
        js_plugin = create_js_plugin(PACKAGE_NAMESPACE, JS_NAME)
        safe.register(js_plugin)
```

Deephaven discovers this via entry points defined in `setup.cfg` / `pyproject.toml` (template handles this). Ensure the registration class stays exported and importable.

## JavaScript Plugin Object

`src/js/src/helloElementPlugin.ts`:

```ts
import { type ElementPlugin, PluginType } from '@deephaven/plugin';
import HelloElementView from './HelloElementView';

export const helloElementPlugin: ElementPlugin = {
  name: 'hello-element',
  type: PluginType.ELEMENT_PLUGIN,
  mapping: {
    // Key MUST equal the Python BaseElement name
    hello_element: HelloElementView,
  },
};

export default helloElementPlugin;
```

## React View Implementation

`HelloElementView.tsx` (simplified):

```tsx
import React, { useState } from 'react';
import { Button, TextField } from '@deephaven/components';

export default function HelloElementView({
  text,
  onClick,
}: {
  text: string;
  onClick: (value: string) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{text}</div>
      <TextField
        value={message}
        onChange={setMessage}
        aria-label="Message"
        marginBottom="size-50"
      />
      <Button kind="primary" onClick={() => onClick(message)}>
        Send
      </Button>
    </div>
  );
}
```

## How Callback Props Work

When you pass a Python callable as a prop to a `@ui.component` (e.g. the `on_click` argument in `hello_element`), Deephaven automatically exposes it to the React side as an async function (`onClick`) without extra wiring code.

### Lifecycle

1. Python component is invoked: `hello_element(text=..., on_click=some_callable)`.
2. The component collects its arguments via `props = locals()` and returns `ui.BaseElement('hello_element', **props)`.
3. During serialization of the `BaseElement`, Deephaven inspects each prop. Primitive values (str, int, float, dict, list, tables, etc.) are encoded directly. Callables are registered internally and replaced with a lightweight callback handle in the element payload sent to the browser.
4. The JavaScript plugin mapping (`hello_element: HelloElementView`) ensures the React component receives a prop named after the original Python parameter, but converted to lower camel case (`on_click` ➜ `onClick`).
5. In React, calling `onClick(message)` dispatches an asynchronous RPC back to the server using that handle. The argument(s) are serialized and delivered to the original Python callable.
6. The Python callable executes server‑side. Any return value is ignored unless the client expects one; by convention these UI callbacks are fire‑and‑forget but can return a value which resolves the Promise on the JS side.

### Naming Conversion

Python parameter names using snake_case are exposed to JS using camelCase for ergonomic React usage (`on_click` ➜ `onClick`). Non‑snake names are passed through unchanged. Keep names descriptive; avoid shadowing reserved browser event names unless intentionally mimicking them.

### Async Behavior

On the JS side, the generated function returns a `Promise`. If the Python callable raises an exception, that error propagates back and the Promise rejects — you can add `.catch()` client‑side to surface errors (toast, inline alert, etc.).

### Argument Passing Rules

- Arguments must be JSON‑serializable or Deephaven‑serializable (tables, figures, etc.) supported by the UI layer.
- Large objects (e.g. big tables) should generally not be passed every click; instead pass identifiers and look them up server‑side for efficiency.
- Mutability: Values are transmitted by value or reference depending on type; modifying a received argument in JS does not mutate server state unless explicitly sent back.

### Best Practices

- Keep callbacks side‑effect focused (logging, updating tables) and fast — long operations block user feedback.
- Return a small confirmation value if the client should react after completion (e.g. `return "ok"`).
- Guard server code with try/except to log and prevent silent failures; surface friendly errors back to the client.
- Debounce or disable UI controls while awaiting the Promise to avoid duplicate submissions.

### Example Enhanced Callback

```python
@ui.component
def hello_element(
    text: str = "Hello", on_click: Callable[[str], str] = lambda v: v.upper()
) -> ui.BaseElement:
    return ui.BaseElement("hello_element", text=text, on_click=on_click)
```

React usage:

```tsx
onClick(message)
  .then(result => console.log('Server replied:', result))
  .catch(err => showToast(err.message));
```

This pattern lets your element provide round‑trip processing while retaining the simple declarative Python API.

Edge cases to consider:

- Empty string submission – decide whether to send.
- Large messages – optionally truncate client-side.
- Slow callback – add loading indicator.
- Callback failure – show toast / error state.
- Multiple rapid clicks – debounce or disable while sending.

## Index Barrel (JS)

The template includes an `index.ts` that re‑exports the plugin object; keep that intact so bundling exposes it.

## Building the JavaScript Bundle

In the `js` directory:

```bash
cd hello_element/src/js
npm install   # or: npm ci
npm run build # template likely uses Vite; produces dist assets
```

Artifacts are copied/packaged into the Python distribution (see `setup.py` logic in template). The `create_js_plugin` helper loads them at runtime.

## Building & Installing the Python Package

From the project root (`hello_element/`):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -U pip build
python -m build  # creates wheel + sdist under dist/
pip install dist/hello_element-<version>-py3-none-any.whl
```

To make it available to a Deephaven Docker stack, either:

- Mount the source into the server image and `pip install -e .`
- Or copy the wheel into an image layer / `requirements.txt` and rebuild.

## Verifying Registration

Start Deephaven and in a Python console:

```python
from deephaven import ui
from hello_element.hello_element import hello_element

ui.show(
    hello_element(
        text="Greetings!", on_click=lambda msg: print("Server received:", msg)
    )
)
```

You should see your custom element render; sending a message triggers the server callback.

## Common Pitfalls

| Issue                  | Cause                                                                   | Fix                                                                 |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Element not rendering  | Name mismatch between Python `BaseElement('name')` and JS `mapping` key | Keep them identical (`hello_element`)                               |
| Callback never fires   | Wrong prop name or not passed through `locals()`                        | Ensure `props = locals()` and React uses `onClick` (case-sensitive) |
| JS not found           | Bundle not included in Python package                                   | Check setup configuration; rebuild after JS build                   |
| Multiple registrations | Duplicate wheel versions installed                                      | Uninstall older versions (`pip uninstall`)                          |

## Extending Further

- Add more components by repeating Python `@ui.component` + adding mapping entries in the JS plugin.
- Share logic via utility modules in Python or React hooks in JS.
- Provide typed props (TypeScript interfaces) and docstrings for clarity.
- Add tests: Python unit tests for component creation; Jest/Playwright for UI behavior.

## Minimal Test (Python)

```python
from hello_element.hello_element import hello_element
from deephaven import ui

e = hello_element(text="Test")
assert e.name == "hello_element"
assert e.props["text"] == "Test"
```

## Checklist Before Publishing

- Names consistent across Python & JS.
- Registration class present and installed.
- JS build artifacts generated prior to `python -m build`.
- Wheel installs and imports without errors.
- Basic UI smoke test passes.

## Next Steps

Consider creating a dashboard using your new element, or packaging a suite of related elements in a single plugin. For advanced behavior (table listeners, live data), pair your element with Deephaven table hooks or state updates.
