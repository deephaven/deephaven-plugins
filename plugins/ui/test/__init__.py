from deephaven_server.server import Server

# Make sure the server is running first thing
# Otherwise we get errors whenever we try to import anything or run tests
if Server.instance is None:
    # Use port 11000 so it doesn't conflict with another server
    s = Server(port=11000, jvm_args=["-Xmx4g"])
    s.start()
