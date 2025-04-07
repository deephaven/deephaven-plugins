from deephaven_server.server import Server
import os
import pathlib

# Create a Server instance to initialize the JVM
# Otherwise we get errors whenever we try to import anything or run tests
# We don't even need to start the server, just create an instance.
# https://github.com/deephaven/deephaven-core/blob/b5cae98c2f11b032cdd1b9c248dc5b4a0f95314a/py/embedded-server/deephaven_server/server.py#L152
# Whenever you import anything from the deephaven namespace, it will check if the JVM is ready:
# https://github.com/deephaven/deephaven-core/blob/b5cae98c2f11b032cdd1b9c248dc5b4a0f95314a/py/server/deephaven/__init__.py#L15
if Server.instance is None:
    Server(port=10000, jvm_args=["-Xmx4g"])

    # Initialize the calendars since they only need to be initialized once
    from deephaven.calendar import add_calendar, set_calendar

    path = pathlib.Path(__file__).parent.absolute()
    resource_path = os.path.join(path, "resources")
    calendar_path = os.path.join(resource_path, "test_calendar.calendar")
    calendar_path_2 = os.path.join(resource_path, "test_calendar_2.calendar")

    add_calendar(calendar_path)
    add_calendar(calendar_path_2)

    # set the default calendar
    set_calendar("TestCalendar")
