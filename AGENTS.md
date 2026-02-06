# Agent Guidelines

## Python Environment

Activate the virtual environment before running Python commands:

```sh
source .venv/bin/activate
```

Exception: Skip when initially creating the venv itself.

## Unit Tests

Run tests from the plugin directory using tox with Python 3.12:

```sh
cd plugins/<plugin-name> && tox -e py3.12
```

Example: `cd plugins/ui && tox -e py3.12`
