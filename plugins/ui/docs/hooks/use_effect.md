# use_effect

`use_effect` is a hook that lets you synchronize a component with an external system. It is similar to [`useEffect` in React](https://react.dev/reference/react/useEffect). An effect has 3 key parts:

1. **Effect function**: The function that runs when the component is mounted, and when the dependencies change.
2. **Dependency list**: A list of reactive values that the effect depends on. The effect will run when the component is mounted, and when any of the dependencies change. If a dependencies list is not provided, the effect will run after every render.
3. **Cleanup function**: A function to cleanup the previous effect before the next effect function runs, or when the component is closed (unmounted). The cleanup function is optionally returned from the effect function.

## Example

```python
from deephaven import ui


@ui.component
def ui_effect_example():
    def handle_mount():
        # prints "Mounted" once when component is first rendered
        print("Mounted")
        # prints "Unmounted" when component is closed
        return lambda: print("Unmounted")

    # Passing in an empty list for dependencies will run the effect only once when the component is mounted, and cleanup when the component is unmounted
    ui.use_effect(handle_mount, [])

    return ui.text("Effect Example")


effect_example = ui_effect_example()
```

## Recommendations

Recommendations for creating effects:

1. Use effects to interact with an external system, such as connecting to an external server.
2. Return a cleanup function from effects to cleanup any resources, such as disconnecting from a server.
3. Put long-running effects on another thread to avoid blocking the render thread.
4. Specify a dependency list to ensure the effect only runs when the dependencies change.

## Connecting to an external server

Create a chat room component that connects to a server when the server URL or room ID changes. The connection is cleaned up when the component is closed. This example simply prints to the console when connecting/disconnecting from a room, rather than opening an actual connection.

```python
from deephaven import ui


class ChatConnection:
    server_url: str
    room_id: str

    def __init__(self, server_url: str, room_id: str):
        self.server_url = server_url
        self.room_id = room_id

    def connect(self):
        print(f"Connecting to {self.server_url}/{self.room_id}")

    def disconnect(self):
        print(f"Disconnected from {self.server_url}/{self.room_id}")


@ui.component
def ui_chat_room(server_url: str):
    room_id, set_room_id = ui.use_state("general")
    connection = ChatConnection(server_url, room_id)

    def create_connection():
        connection = ChatConnection(server_url, room_id)
        connection.connect()
        return lambda: connection.disconnect()

    ui.use_effect(create_connection, [server_url, room_id])

    return [
        ui.picker(
            "general",
            "random",
            "private",
            label="Choose the chat room:",
            selected_key=room_id,
            on_change=set_room_id,
        ),
        ui.text(f"Connected to {room_id} on {server_url}"),
    ]


@ui.component
def ui_chat_app():
    server_url, set_server_url = ui.use_state("https://chat.example.com")
    show, set_show = ui.use_state(False)

    return [
        ui.text_field(label="Server URL", value=server_url, on_change=set_server_url),
        ui.toggle_button("Show chat room", is_selected=show, on_change=set_show),
        ui_chat_room(server_url) if show else None,
    ]


chat_app = ui_chat_app()
```

## Multi-threaded request

Put a long-running request on a background thread so it doesn't block the component from updating.

```python
import threading
import time
from deephaven import ui


@ui.component
def ui_request_delay():
    delay, set_delay = ui.use_state(1)
    message, set_message = ui.use_state("")

    def delayed_request():
        # Keep track of how to cancel a request
        is_cancelled = False

        def do_request():
            # Simulate a long-running request
            time.sleep(delay)

            if is_cancelled:
                return

            set_message(f"Operation with {delay}s delay completed")

        set_message(f"Starting operation with {delay}s delay")

        # Cancel the request if the delay inputted has changed
        threading.Thread(target=do_request).start()

        def cancel_request():
            nonlocal is_cancelled
            is_cancelled = True

        # The returned cleanup function will be called before the next effect function, or when the component is closed
        return cancel_request

    ui.use_effect(delayed_request, [delay])

    return [
        ui.slider(
            label="Delay", value=delay, min_value=1, max_value=10, on_change=set_delay
        ),
        ui.text(message),
    ]


request_delay = ui_request_delay()
```

## Custom hooks wrapping effects

Create custom hooks that wrap effects to encapsulate functionality, such as connection to a server.

```python
from deephaven import ui


def use_server(url: str):
    def disconnect():
        print(f"Disconnected from {url}")

    def connect():
        print(f"Connected to {url}")
        return disconnect  # Cleanup function `disconnect` will be called before the next effect or on unmount

    ui.use_effect(connect, [url])


@ui.component
def ui_server_example():
    url, set_url = ui.use_state("https://httpbin.org")

    use_server(url)

    return [
        ui.text_field(label="Server URL", value=url, on_change=set_url),
        ui.text("See console for connection status"),
    ]


server_example = ui_server_example()
```

## Reactive dependencies

An effect will run after the initial render (mount) and any subsequent render when a dependency has changed. The returned cleanup function will run before the next effect and when the component is closed (unmount). It is important to specify all dependencies in the dependency list to ensure the effect runs when the dependencies change.

In this example below, we connect to a server when the host or scheme changes. The effect will run when the component is mounted, and when the host or scheme is changed:

```python
@ui.component
def ui_server(scheme: str):  # `scheme` is a reactive prop passed in
    host, set_host = ui.use_state("localhost")  # `host` is a reactive state variable

    def disconnect():
        # Our disconnect/cleanup function uses `scheme` and `host`
        print(f"Disconnected from {scheme}://{host}")

    def connect():
        # Our connect/effect function uses `scheme` and `host`
        print(f"Connected to {scheme}://{host}")
        return disconnect

    # ✅ Run connect/effect when `scheme` or `host` changes
    ui.use_effect(connect, [scheme, host])
    # ...
```

However, if we specify an empty dependency list, the effect will only run once when the component is mounted, which is probably not what we want:

```python
@ui.component
def ui_server(scheme: str):
    host, set_host = ui.use_state("localhost")

    def disconnect():
        print(f"Disconnected from {scheme}://{host}")

    def connect():
        print(f"Connected to {scheme}://{host}")
        return disconnect

    # ❌ connect will only run on initial render and cleanup on unmount
    # It will not re-run when `scheme` or `host` changes
    ui.use_effect(connect, [])

    # ...
```

If you use constant values in your effect, you can omit them from the dependency list. If the `host` was instead a constant outside of the component and not reactive, you can omit it from the dependency list:

```python
host = "localhost"


@ui.component
def ui_server(scheme: str):
    def disconnect():
        print(f"Disconnected from {scheme}://{host}")

    def connect():
        print(f"Connected to {scheme}://{host}")
        return disconnect

    # ✅ Run connect/effect when `scheme` changes. `host` is not a reactive value.
    ui.use_effect(connect, [scheme])

    # ...
```

If your effect doesn't use any reactive values, its dependency list should be empty:

```python
scheme = "https"
host = "localhost"


@ui.component
def ui_server():
    def disconnect():
        print(f"Disconnected from {scheme}://{host}")

    def connect():
        print(f"Connected to {scheme}://{host}")
        return disconnect

    # ✅ Run connect/effect on mount, disconnect/cleanup on unmount.
    ui.use_effect(connect, [])

    # ...
```

## Examples of passing dependencies

### Passing a dependency list

If you specify dependencies, the effect will run on initial render and on subsequent re-renders when the dependencies change.

```python
ui.use_effect(..., [scheme, host])  # Runs again when host or scheme changes
```

In the example below, `host` and `scheme` are both reactive values that are used within the effect and cleanup functions. The effect will run when the component is mounted, and when `host` or `scheme` changes, but will not re-run when `message` is changed:

```python
from deephaven import ui


@ui.component
def ui_server(scheme: str):
    host, set_host = ui.use_state("localhost")
    message, set_message = ui.use_state("")

    def disconnect():
        print(f"Disconnected from {scheme}://{host}")

    def connect():
        print(f"Connected to {scheme}://{host}")
        return disconnect

    ui.use_effect(connect, [scheme, host])

    return [
        ui.text_field(label="Host", value=host, on_change=set_host),
        ui.text_field(label="Message", value=message, on_change=set_message),
        ui.text(f"Message is {message}"),
    ]


@ui.component
def ui_app():
    scheme, set_scheme = ui.use_state("https")

    return [
        ui.text_field(label="Scheme", value=scheme, on_change=set_scheme),
        ui_server(scheme),
    ]


app = ui_app()
```

### Passing an empty dependency list

If you specify an empty dependency list, the effect will only run once when the component is mounted, and cleanup on unmount. It will not re-run when any reactive values change.

```python
ui.use_effect(..., [])  # Does not run again
```

In this example, `host` and `scheme` are hardcoded, so they are not listed as dependencies. The dependency list is empty, so the effect will only run once when the component is mounted, and cleanup on unmount:

```python
from deephaven import ui

scheme = "https"
host = "localhost"


@ui.component
def ui_server():
    message, set_message = ui.use_state("")

    def disconnect():
        print(f"Disconnected from {scheme}://{host}")

    def connect():
        print(f"Connected to {scheme}://{host}")
        return disconnect

    ui.use_effect(connect, [scheme, host])

    return [
        ui.text_field(label="Message", value=message, on_change=set_message),
        ui.text(f"Message is {message}"),
    ]


@ui.component
def ui_app():
    return ui_server()


app = ui_app()
```

### Passing no dependency list

If you specify no dependency list, the effect will run after every single render.

```python
ui.use_effect(...)  # Runs after every render
```

In this example, the effect runs whenever `host` or `scheme` changes, but then will _also_ run if `message` changes, which is probably not what you want. This is why you should usually specify the dependency list.

```python
from deephaven import ui


@ui.component
def ui_server(scheme: str):
    host, set_host = ui.use_state("localhost")
    message, set_message = ui.use_state("")

    def disconnect():
        print(f"Disconnected from {scheme}://{host}")

    def connect():
        print(f"Connected to {scheme}://{host}")
        return disconnect

    ui.use_effect(connect)  # No dependency list

    return [
        ui.text_field(label="Host", value=host, on_change=set_host),
        ui.text_field(label="Message", value=message, on_change=set_message),
        ui.text(f"Message is {message}"),
    ]


@ui.component
def ui_app():
    scheme, set_scheme = ui.use_state("https")

    return [
        ui.text_field(label="Scheme", value=scheme, on_change=set_scheme),
        ui_server(scheme),
    ]


app = ui_app()
```

## Removing unnecessary object dependencies

If your effect depends on an object or function that is recreated on every render, you may want to memoize it to avoid unnecessary re-renders.

```python
class ServerDetails:
    scheme: str
    host: str

    def __init__(self, scheme: str, host: str):
        self.scheme = scheme
        self.host = host

    def __str__(self):
        return f"{self.scheme}://{self.host}"


@ui.component
def ui_server():
    message, set_message = ui.use_state("")

    # 🚩 this creates a new object on every re-render
    details = ServerDetails("https", "localhost")

    def disconnect():
        print(f"Disconnected from {details}")

    def connect():
        print(f"Connected to {details}")
        return disconnect

    # 🚩 As a result, these dependencies are different on every re-render and the effect will always run again
    ui.use_effect(connect, [details])

    # ...
```

To avoid this, declare the object inside the effect:

```python
@ui.component
def ui_server():
    message, set_message = ui.use_state("")

    def disconnect(details: ServerDetails):
        print(f"Disconnected from {details}")

    def connect():
        # ✅ details object only created within the effect
        details = ServerDetails("https", "localhost")
        print(f"Connected to {details}")
        return lambda: disconnect(details)

    # ✅ Effect will only run once
    ui.use_effect(connect, [])

    # ...
```

Alternatively, memoize the object using [`use_memo`](./use_memo.md):

```python
from deephaven import ui


class ServerDetails:
    scheme: str
    host: str

    def __init__(self, scheme: str, host: str):
        self.scheme = scheme
        self.host = host

    def __str__(self):
        return f"{self.scheme}://{self.host}"


@ui.component
def ui_server():
    message, set_message = ui.use_state("")

    # ✅ this object is created and memoized once
    details = ui.use_memo(lambda: ServerDetails("https", "localhost"), [])

    def disconnect():
        print(f"Disconnected from {details}")

    def connect():
        print(f"Connected to {details}")
        return disconnect

    # ✅ As a result, these dependencies do not change and will only be run once
    ui.use_effect(connect, [details])

    return [
        ui.text_field(label="Message", value=message, on_change=set_message),
        ui.text(f"Message is {message}"),
    ]


server = ui_server()
```

## Removing unnecessary function dependencies

Similarly, if your effect depends on a function declared within the component, you may want to memoize it to avoid unnecessary re-renders.

```python
@ui.component
def ui_server():
    message, set_message = ui.use_state("")

    # 🚩 this function is a new function on every re-render
    def create_details():
        return ServerDetails("https", "localhost")

    def disconnect(details):
        print(f"Disconnected from {details}")

    def connect():
        details = create_details()
        print(f"Connected to {details}")
        return lambda: disconnect(details)

    # 🚩 As a result, these dependencies are different on every re-render and the effect will always run again
    ui.use_effect(connect, [create_details])

    # ...
```

To avoid this, move the function inside the effect:

```python
@ui.component
def ui_server():
    message, set_message = ui.use_state("")

    def disconnect(details: ServerDetails):
        print(f"Disconnected from {details}")

    def connect():
        # ✅ create_details function only created within the effect
        def create_details():
            return ServerDetails("https", "localhost")

        details = create_details()
        print(f"Connected to {details}")
        return lambda: disconnect(details)

    # ✅ As a result, these dependencies are different on every re-render and the effect will always run again
    ui.use_effect(connect, [])

    # ...
```

Alternatively, memoize the function using [`use_callback`](./use_callback.md):

```python
from deephaven import ui


class ServerDetails:
    scheme: str
    host: str

    def __init__(self, scheme: str, host: str):
        self.scheme = scheme
        self.host = host

    def __str__(self):
        return f"{self.scheme}://{self.host}"


@ui.component
def ui_server():
    message, set_message = ui.use_state("")

    # ✅ this function is created with `use_callback` and memoized whenvever dependencies change
    create_details = ui.use_callback(lambda: ServerDetails("https", "localhost"), [])

    def disconnect(details: ServerDetails):
        print(f"Disconnected from {details}")

    def connect():
        details = create_details()
        print(f"Connected to {details}")
        return lambda: disconnect(details)

    # ✅ As a result, these dependencies do not change and will only be run once
    ui.use_effect(connect, [create_details])

    return [
        ui.text_field(label="Message", value=message, on_change=set_message),
        ui.text(f"Message is {message}"),
    ]


server = ui_server()
```
