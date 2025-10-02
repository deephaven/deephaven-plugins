# Deephaven Local Python Execution Plugin

A Deephaven bi-directional plugin to allow sourcing Python imports from a remote file source. It consists of a Python plugin installed and then instantiated in a Deephaven core / core+ worker. When a client connects to the plugin, a custom Python `sys.meta_path` finder and loader are registered that will send messages to the client to request content for loading modules.

## Additional Docs

- [docs/DESIGN.md](docs/DESIGN.md) - Notes on architecture / design.
- [README_TEMPLATE.md](README_TEMPLATE.md) - Template scafolded by original cookiecutter template. Will eventually delete once `README` is completed.

## Dev

A DH server can be started via `./scripts/dev.sh` (Note that this requires venv to be active and initial build to have been run at least once per the template docs)
