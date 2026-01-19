# AI Agent Guide for deephaven-plugins

This guide provides essential information for AI agents working in the deephaven-plugins repository.

## Repository Overview

This repository contains Deephaven plugin modules, including both Python and JavaScript plugins located in the `plugins/` folder.

## Feature Planning

For complex features, create detailed plan documents in `plugins/<plugin-name>/plans/`:

- **Naming**: Use ticket numbers (e.g., `DH-12345.md`)
- **Structure**: Include overview, goals, technical design, implementation plan, testing strategy, documentation needs, and open questions
- **Purpose**: Design documentation, implementation reference, and historical record of decisions

See [plugins/ui/plans/README.md](plugins/ui/plans/README.md) for complete guidelines.

## Environment Setup

### Python Environment

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade -r requirements.txt

# Install pre-commit hooks
pre-commit install
```

### JavaScript Environment

```bash
# Install JS dependencies
npm install
```

## Building Plugins

### Building Python Plugins

Build Python plugin wheels from the root directory:

```bash
# Build specific plugins
python -m build --wheel plugins/matplotlib
python -m build --wheel plugins/plotly

# Install built wheels
pip install plugins/*/dist/*.whl

# Force reinstall during development (without version bump)
pip install --force-reinstall --no-deps plugins/*/dist/*.whl
```

### Building JavaScript Plugins

```bash
# Build all JS plugins in watch mode (also serves plugins directory)
npm start

# Build specific plugins matching a pattern
npm start -- --scope *theme*

# Build a single plugin in watch mode (without dev server)
cd plugins/<plugin-name>
npm start
```

The dev server runs at `http://localhost:4100` (configurable via `PORT` env variable).

### Using plugin_builder.py

The `plugin_builder.py` script automates common development tasks:

```bash
# Install click and watchdog dependencies
pip install click watchdog

# Configure environment (minimal)
python tools/plugin_builder.py --configure=min

# Configure environment (full - includes docs and server)
python tools/plugin_builder.py --configure=full

# Build all plugins
python tools/plugin_builder.py

# Build specific plugins
python tools/plugin_builder.py plotly-express ui

# Build with JS plugins
python tools/plugin_builder.py --js ui

# Install/reinstall plugins
python tools/plugin_builder.py --install plotly-express
python tools/plugin_builder.py --reinstall ui

# Build docs for a plugin
python tools/plugin_builder.py --docs --install ui

# Re-generate doc snapshots
python tools/plugin_builder.py --docs --snapshots ui

# Start server with plugins
python tools/plugin_builder.py --reinstall --server plotly-express

# Watch mode (rebuilds on changes)
python tools/plugin_builder.py --watch plotly-express

# Combined flags (short form)
python tools/plugin_builder.py -jrsw ui  # js, reinstall, server, watch
```

## Running Tests

### Unit Tests (Python)

Python plugins use `tox` for testing:

```bash
# Run tests for a plugin (from plugins/<plugin> directory)
cd plugins/<plugin-name>
tox -e py

# Run tests against specific Python version
tox -e py3.12
```

Note: `tox` runs against Python 3.9 by default. Ensure the target Python version is installed on your system.

### End-to-End Tests

E2E tests use Playwright and test against Chrome, Firefox, and Webkit:

```bash
# Run tests locally in UI mode (recommended for development/debugging)
npm run e2e:ui

# Run E2E tests in Docker (matches CI environment, use for validation)
npm run e2e:docker

# Run specific test file
npm run e2e:docker -- ./tests/matplotlib.spec.ts

# Run specific test in specific browser
npm run e2e:docker -- --project firefox ./tests/matplotlib.spec.ts

# Update snapshots (use Docker for consistency with CI)
npm run e2e:update-snapshots

# Update snapshots for specific test
npm run e2e:update-snapshots -- ./tests/ui.spec.ts
```

**Note**: If you encounter permissions issues after running Docker tests, delete the test-results folder: `sudo rm -rf test-results`

## Running the Development Server

### With deephaven-core (Recommended)

1. Build deephaven-core following [these instructions](https://deephaven.io/core/docs/getting-started/launch-build/#build-and-run-deephaven)

2. Install plugin wheels into deephaven-core venv:

```bash
pip install <path-to-plugins>/plugins/*/dist/*.whl
```

3. Start deephaven-core with js-plugin flags:

```bash
START_OPTS="-Ddeephaven.jsPlugins.@deephaven/js-plugin-matplotlib=<deephaven-plugins-path>/plugins/matplotlib/src/js -Ddeephaven.jsPlugins.@deephaven/js-plugin-plotly=<deephaven-plugins-path>/plugins/plotly/src/js" ./gradlew server-jetty-app:run
```

Server opens at `http://localhost:10000/ide/`

### With Docker (Alternative)

```bash
# Start Docker container with all plugins
npm run docker
# or
docker compose up --build

# Use custom port
DEEPHAVEN_PORT=11000 npm run docker
```

Server runs at `http://localhost:10000` by default. JS plugins are configured in `./docker/config/deephaven.prop`.

## Documentation

### Preview Docs

```bash
# Preview docs from source (without API reference)
npm run docs

# Build and preview full docs
python tools/plugin_builder.py -d ui plotly-express
BUILT=true npm run docs
```

Docs preview runs at `http://localhost:3001`.

### Update Doc Snapshots

```bash
# Using plugin_builder.py
python tools/plugin_builder.py --docs --snapshots ui

# Using npm
npm run update-doc-snapshots
```

## Code Quality

### Pre-commit Hooks

The repository uses pre-commit hooks for:

- Black and blacken-docs formatting
- Pyright type checking
- Ruff linting

```bash
# Test pre-commit hooks
pre-commit run --all-files

# Bypass pre-commit on commit
git commit --no-verify -m "commit message"
```

## Common Development Workflows

### Developing a Python Plugin

```bash
python tools/plugin_builder.py --reinstall <plugin-name>
cd plugins/<plugin-name>
tox -e py
```

### Developing a JS Plugin

```bash
npm start -- --scope *<plugin-name>*
npm run e2e:ui  # for testing
```

### Full Development Cycle with Server

```bash
# Build everything and start server with watch mode
python tools/plugin_builder.py -jrsw <plugin-name>
```

### Running All Tests

```bash
# Python unit tests
cd plugins/<plugin-name>
tox -e py

# E2E tests (local UI mode for development)
npm run e2e:ui

# E2E tests (Docker for CI validation)
npm run e2e:docker
```

## Release Management

See the main README.md for detailed release procedures using `cocogitto` (`cog`).

```bash
# Release a plugin
tools/release.sh <pluginName>
```

This must be done on the `main` branch and requires:

- GitHub CLI tool
- cocogitto (cog) installed
- Conventional commit messages
