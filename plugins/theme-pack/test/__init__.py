from deephaven_server.server import Server

# Create a Server instance to initialize the JVM
# Otherwise we get errors whenever we try to import anything or run tests
# We don't even need to start the server, just create an instance.
# https://github.com/deephaven/deephaven-core/blob/b5cae98c2f11b032cdd1b9c248dc5b4a0f95314a/py/embedded-server/deephaven_server/server.py#L152
# Whenever you import anything from the deephaven namespace, it will check if the JVM is ready:
# https://github.com/deephaven/deephaven-core/blob/b5cae98c2f11b032cdd1b9c248dc5b4a0f95314a/py/server/deephaven/__init__.py#L15
if Server.instance is None:
    Server(port=11000, jvm_args=["-Xmx4g"])
