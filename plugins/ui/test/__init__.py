from deephaven_server.server import Server

# Try and start the server if it's not already running
# Otherwise we get errors whenever we try to import anything or run tests
try:
    if Server.instance is None:
        # Use port 11000 so it doesn't conflict with another server
        s = Server(port=11000, jvm_args=["-Xmx4g"])
        s.start()
except Exception as e:
    #  Even if starting the server throws, we want to continue to try and run our tests
    # We don't _really_ need a server running to run our tests, we just need the server to be running to import the deephaven namespace
    pass
