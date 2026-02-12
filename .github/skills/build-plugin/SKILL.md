---
name: build-plugin
description: Build and install Python plugins using plugin_builder.py. Use when asked to build, install, or reinstall a plugin.
---

# Building Plugins

Use `plugin_builder.py` from repo root. Requires venv activation first.

## Commands

```bash
# Activate venv first
source .venv/bin/activate

# Build and install a plugin
python tools/plugin_builder.py --install ui

# Reinstall a plugin (use when code changed but version not bumped)
python tools/plugin_builder.py --reinstall ui

# Build multiple plugins
python tools/plugin_builder.py --reinstall ui plotly-express

# Build with JS assets
python tools/plugin_builder.py --js --reinstall ui

# Build and start server
python tools/plugin_builder.py --reinstall --server ui
```

## Common flags

- `--install` / `-i`: Install plugin
- `--reinstall` / `-r`: Force reinstall (no version bump needed)
- `--js` / `-j`: Also build JS assets
- `--server` / `-s`: Start deephaven-server after build
- `--docs` / `-d`: Build documentation

## Notes

- Use `--reinstall` during development when version hasn't changed
- First run may take longer to install dependencies
