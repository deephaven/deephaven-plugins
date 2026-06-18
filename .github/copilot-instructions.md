# Copilot Instructions for `deephaven-plugins`

## Repository overview

- This repository is a mixed Python + JavaScript monorepo for Deephaven plugins.
- Most plugin work happens under `plugins/<plugin>/`.
- JavaScript plugin packages live in `plugins/*/src/js/` and are managed from the repo root with npm workspaces.
- Some plugins are Python-only, some are JS-only, and some have both.
- Architecture details for server-plugin / JS-plugin interaction are documented in `ARCHITECTURE.md`.

## First steps in every terminal

Always activate the repository virtual environment before doing anything else:

```bash
source .venv/bin/activate
```

If `.venv` does not exist yet, create it from the repo root and install the repo requirements:

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade -r requirements.txt
```

Node is managed from the repo root. The expected version is in `.nvmrc` (`v24.10.0`).

## Repo structure that matters most

- `plugins/` — plugin source code
- `tests/` — Playwright end-to-end tests
- `tools/plugin_builder.py` — the main helper for building, reinstalling, serving, and watching plugins
- `sphinx_ext/` — Sphinx extensions and doc build requirements
- `.github/workflows/` — the authoritative source for CI behavior
- `templates/` — cookiecutter plugin templates; treat them as templates, not active packages

## Fast path for common tasks

Run commands from the repository root unless a plugin-specific path is called out.

### Python environment and linting

```bash
source .venv/bin/activate
pre-commit run --all-files
```

- `pre-commit` runs Black, blacken-docs, Pyright, and Ruff.
- This is the safest first validation for Python or Markdown changes.

### JavaScript install, build, and test

```bash
source .venv/bin/activate
npm ci --no-audit
npm run build
npm run test:ci
```

- `npm run build` builds all JS workspaces.
- `npm run test:ci` runs both JS unit tests and lint tests from the repo root.
- `npm run test:unit -- --testPathPattern="plugins/<plugin>"` is the fastest targeted JS test command for one plugin.

### Python plugin tests

From a specific plugin directory:

```bash
cd plugins/<plugin>
source ../../.venv/bin/activate
tox -e py3.12
```

- CI runs Python plugin tox environments across Python 3.9 through 3.13.
- For local agent work, `tox -e py3.12` is a good default when the plugin supports tox.

### Build and reinstall plugins

Preferred helper:

```bash
source .venv/bin/activate
python tools/plugin_builder.py --reinstall <plugin>
```

Useful variants:

```bash
python tools/plugin_builder.py --js --reinstall <plugin>
python tools/plugin_builder.py --docs --install <plugin>
python tools/plugin_builder.py --reinstall --server <plugin>
```

- `plugin_builder.py` is the repo’s preferred automation entry point for plugin iteration.
- It also supports `--watch` for repeated rebuilds.

### End-to-end tests

Prefer the Docker-backed Playwright workflow because CI uses the same setup:

```bash
source .venv/bin/activate
npm run e2e:docker -- ./tests/<file>.spec.ts --reporter=list
```

Other useful commands:

```bash
npm run e2e:ui
npm run e2e:update-snapshots -- ./tests/<file>.spec.ts
```

### Docs work

Preview docs from source:

```bash
source .venv/bin/activate
npm run docs
```

Build plugin docs with API references:

```bash
source .venv/bin/activate
pip install -r sphinx_ext/sphinx-requirements.txt
python tools/plugin_builder.py --docs --install <plugin>
```

Important doc notes:

- Only plugins with `make_docs.py` support generated docs builds.
- Built docs land in `plugins/<plugin>/docs/build/markdown/`.
- Do **not** commit generated files from `docs/build/markdown/`.
- For `plugins/ui` and `plugins/plotly-express`, prefer the project’s custom `dhautofunction` API reference directive instead of manually duplicating signatures.

## How CI is organized

- `pre-commit.yml` runs formatting/lint/type checks.
- `test-js-packages.yml` runs `npm run build`, `npm run types`, and `npm run test:ci`.
- `test-python-package.yml` runs `tox` per plugin across a Python version matrix.
- `modified-plugin.yml` detects changed plugins and fans out Python tests, JS tests, and docs builds.
- `build-docs.yml` only builds docs for plugins that contain `make_docs.py`.
- `e2e.yml` runs Playwright in Docker across Chromium, Firefox, and WebKit shards.

When deciding what to validate:

- Markdown-only changes: run `pre-commit run --all-files`.
- Python plugin changes: run `pre-commit run --all-files` and plugin `tox` if available.
- JS changes: run `npm run build` and `npm run test:ci`, or at least targeted `npm run test:unit -- --testPathPattern="plugins/<plugin>"`.
- E2E-related changes: prefer `npm run e2e:docker`.
- Docs changes for doc-generating plugins: run `python tools/plugin_builder.py --docs --install <plugin>` when practical.

## Repo-specific gotchas

- Always activate `.venv` first; many repo commands assume it.
- JS builds and tests are root-level commands even when you only changed one plugin.
- `templates/` contains placeholder package names and can trigger tooling noise; do not “fix” template placeholders unless the task is specifically about templates.
- Some plugin docs are generated; output under `docs/build/markdown/` is build output, not source.
- `plugin_builder.py` ignores `dist/`, `build/`, `node_modules/`, hidden directories, and `plugins/python-remote-file-source/test-node-client/` while watching files.

## Errors and workarounds seen while onboarding this repo

### Missing virtual environment

Error:

```text
bash: .venv/bin/activate: No such file or directory
```

Workaround:

- Create the venv from the repo root with `python -m venv .venv`.
- Re-run `source .venv/bin/activate`.
- Install requirements with `pip install --upgrade -r requirements.txt`.

### `npm ci` deprecation noise

Observed during `npm ci --no-audit`:

- multiple dependency deprecation warnings from transitive packages

Workaround:

- Treat these as existing dependency noise unless the task is specifically dependency maintenance.
- `npm ci --no-audit` still completed successfully.

### `npm run test:ci` template collision warning

Observed warning:

```text
jest-haste-map: Haste module naming collision: {{ cookiecutter.javascript_project_name }}
```

Cause:

- Both template package trees under `templates/element/.../src/js/package.json` and `templates/widget/.../src/js/package.json` intentionally use the same cookiecutter placeholder names.

Workaround:

- Treat this as an existing repository warning when tests still pass.
- Do not rename template placeholders just to silence the warning unless the task is about the template or Jest configuration.

### TypeScript support warning in lint tests

Observed warning:

```text
WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.
SUPPORTED TYPESCRIPT VERSIONS: >=3.3.1 <5.2.0
YOUR TYPESCRIPT VERSION: 5.9.3
```

Workaround:

- Treat this as existing tooling drift when tests pass.
- Do not change TypeScript or eslint stack versions unless dependency/tooling updates are part of the task.

### Build warnings that are currently tolerated

Observed during `npm run build`:

- Vite CJS API deprecation warnings
- Sass deprecation warnings in the `ui` plugin
- warnings about mixed default + named exports
- warnings about `eval` in transitive dependencies

Workaround:

- These warnings are currently tolerated by the repository build.
- Only address them when the task is specifically about build tooling, Sass migration, or dependency cleanup.

## Efficient agent behavior

- Read the root `README.md`, relevant plugin `README.md`, and the matching workflow file before changing build/test behavior.
- Prefer small, plugin-scoped changes.
- Use `plugin_builder.py` instead of inventing custom build flows.
- Check whether the changed plugin has `tox.ini` or `make_docs.py` before assuming Python tests or doc generation exist.
- Avoid committing generated build output, `node_modules`, `.venv`, `.tox`, Playwright reports, or docs build artifacts.
