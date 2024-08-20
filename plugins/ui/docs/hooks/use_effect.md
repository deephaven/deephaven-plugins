# use_effect

`use_effect` is a hook that allows you to perform side effects in your components, allowing you to interact with an external system. It is similar to [`useEffect` in React](https://react.dev/reference/react/useEffect).

## Example

```python
from deephaven import ui


@ui.component
def ui_effect_example():
    def handle_mount():
        print("Mounted")
        return lambda: print("Unmounted")

    ui.use_effect(handle_mount, [])

    return ui.text("Effect Example")


effect_example = ui_effect_example()
```

## Recommendations

Recommendations for creating effects:

1. Use effects to interact with an external system, such as connecting to a server.
2. Return a cleanup function from effects to cleanup any resources, such as disconnecting from a server.
3. Put long-running effects on another thread to avoid blocking the render thread.

## Requesting from URL

Using the [requests](https://pypi.org/project/requests/) library, attempt to login to httpbin.org with the entered username and password when it is changed. The correct username is `user` and the correct password is `pass`.

```python
import requests
from deephaven import ui


@ui.component
def ui_request_login():
    user, set_user = ui.use_state("")
    password, set_password = ui.use_state("")
    message, set_message = ui.use_state("")

    def login():
        if not user or not password:
            set_message("Enter user/pass to login")
            return

        response = requests.get(
            "https://httpbin.org/basic-auth/user/pass", auth=(user, password)
        )
        if response.status_code == 200:
            set_message(f"Login successful: ({response.text})")
        else:
            set_message(f"Login failed for {user}: ({response.status_code})")

    ui.use_effect(login, [user, password])

    return [
        ui.text_field(label="User", value=user, on_change=set_user),
        ui.text_field(
            label="Password", value=password, on_change=set_password, type="password"
        ),
        ui.text(message),
    ]


request_login = ui_request_login()
```

## Multi-threaded request

Put a long running request on a background thread so it doesn't block the component from updating.

```python
import requests
import threading
from deephaven import ui


@ui.component
def ui_request_delay():
    delay, set_delay = ui.use_state(1)
    message, set_message = ui.use_state("")

    def delayed_request():
        # Keep track of how to cancel a request
        is_cancelled = False

        def do_request():
            response = requests.get(f"https://httpbin.org/delay/{delay}")
            if is_cancelled:
                return

            if response.status_code == 200:
                set_message(f"Request {delay} successful: ({response.text})")
            else:
                set_message(f"Request {delay} failed: ({response.status_code})")

        set_message(f"Sending request with delay {delay}")

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
    def handle_mount():
        print(f"Connected to {url}")
        return lambda: print(f"Disconnected from {url}")

    ui.use_effect(handle_mount, [url])


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
