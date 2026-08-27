"""Test bootstrap: initialize the JVM so `deephaven` imports work.

Creating (not starting) a Server instance initializes the JVM. Importing
anything from the `deephaven` namespace checks that the JVM is ready, and
this package imports `deephaven` core at import time (e.g. the `data`
submodule). Skipped when deephaven-server is unavailable (pure-mock runs).
"""

try:
    from deephaven_server.server import Server

    if Server.instance is None:
        Server(port=10000, jvm_args=["-Xmx4g"])
except ImportError:
    pass
