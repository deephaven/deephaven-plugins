---
name: build-plugin
description: Build and install Python plugins using plugin_builder.py. Use when asked to build, install, or reinstall a plugin.
---

# Building Plugins

Use `plugin_builder.py` from repo root. Requires venv activation first.

## First-time setup

```bash
# Python dependencies
source .venv/bin/activate
pip install --upgrade -r requirements.txt

# JS dependencies (if building plugins with --js flag)
nvm install
npm install
```

## Commands

```bash
# First install of a plugin (REQUIRED before using --reinstall)
python tools/plugin_builder.py --install ui

# First install with JS assets (for plugins with JS components)
python tools/plugin_builder.py --js --install python-remote-file-source

# Reinstall a plugin (use when code changed but version not bumped)
python tools/plugin_builder.py --reinstall ui

# Build multiple plugins
python tools/plugin_builder.py --reinstall ui plotly-express

# Build with JS assets and reinstall
python tools/plugin_builder.py --js --reinstall ui

# Build, install, and start server
python tools/plugin_builder.py --install --server ui
```

## Common flags

- `--install` / `-i`: Install plugin (REQUIRED on first run)
- `--reinstall` / `-r`: Force reinstall (no version bump needed, only after --install)
- `--js` / `-j`: Also build JS assets (additive - Python build still happens)
- `--server` / `-s`: Start deephaven-server after build
- `--docs` / `-d`: Build documentation
- `--server-arg` / `-sa`: Pass argument to deephaven server (e.g., `-sa --port=9999`)

## Notes

- **Must use `--install` on first run** - `--reinstall` will fail if plugin not already installed
- Assumes Python `.venv` is already sourced (`source .venv/bin/activate`)
- Use `--reinstall` during development when version hasn't changed
- Running with no flags defaults to `--js --install` for all plugins
- First run may take longer to install dependencies
