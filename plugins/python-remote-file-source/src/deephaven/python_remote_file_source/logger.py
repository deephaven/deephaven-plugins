class Logger:
    """
    Basic scoped logger class with different log levels.
    """

    def __init__(self, name: str):
        self.name = "DeephavenPythonRemoteFileSourcePlugin." + name

    def debug(self, *args):
        print("[DEBUG]", f"[{self.name}]", *args)

    def info(self, *args):
        print("[INFO]", f"[{self.name}]", *args)

    def warning(self, *args):
        print("[WARNING]", f"[{self.name}]", *args)

    def error(self, *args):
        print("[ERROR]", f"[{self.name}]", *args)
