from deephaven_server.server import Server

# Create a Server instance to initialize the JVM before anything in the deephaven namespace is imported.
if Server.instance is None:
    Server(port=10000, jvm_args=["-Xmx4g"])
