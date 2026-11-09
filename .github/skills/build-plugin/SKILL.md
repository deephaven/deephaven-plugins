---
name: build-plugin
description: Build and install Python plugins using plugin_builder.py. Use when asked to build, install, or reinstall a plugin.
---

# Building Plugins

Use `plugin_builder.py` from repo root. Requires venv activation first.

By default, plugins are installed in **editable mode** (`pip install -e`), so
Python source edits take effect without rebuilding. Pass `--wheel` to use the
legacy build-wheel-then-install flow.

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
# First install of a plugin (editable)
python tools/plugin_builder.py --install ui

# First install with JS assets (for plugins with JS components)
python tools/plugin_builder.py --js --install python-remote-file-source

# Reinstall a plugin (use when JS bundles or entry points need re-linking)
python tools/plugin_builder.py --reinstall ui

# Build multiple plugins
python tools/plugin_builder.py --reinstall ui plotly-express

# Build with JS assets and reinstall
python tools/plugin_builder.py --js --reinstall ui

# Build, install, and start server
python tools/plugin_builder.py --install --server ui

# Legacy wheel-based flow (build wheels and install them)
python tools/plugin_builder.py --wheel --reinstall ui
```

## Common flags

- `--install` / `-i`: Install plugin (editable by default)
- `--reinstall` / `-r`: Force reinstall (`--force-reinstall --no-deps`); useful
  to refresh JS bundles or re-link entry points
- `--js` / `-j`: Also build JS assets (additive - Python install still happens)
- `--server` / `-s`: Start deephaven-server after build
- `--docs` / `-d`: Build documentation
- `--server-arg` / `-sa`: Pass argument to deephaven server (e.g., `-sa --port=9999`)
- `--wheel`: Opt out of editable mode and use the legacy build-wheel + install path
- `--build` / `-b`: Build wheels (only meaningful with `--wheel`; ignored otherwise)

## Notes

- Editable installs mean Python source changes take effect on the next server
  restart without rerunning the builder.
- Use `--reinstall` when you've changed JS bundles, entry points, or package
  metadata that needs re-linking.
- JS assets are still bundled into `src/deephaven/<pkg>/_js/` during install
  (driven by each plugin's `setup.py`); rerun the install when JS changes.
- Assumes Python `.venv` is already sourced (`source .venv/bin/activate`).
- Running with no flags defaults to `--js --install` for all plugins.
- First run may take longer to install dependencies.
- `--wheel` is required if you specifically need a wheel artifact (e.g. to
  inspect or distribute it); CI builds wheels independently of this script.
