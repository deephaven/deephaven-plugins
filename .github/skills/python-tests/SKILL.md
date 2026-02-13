---
name: python-tests
description: Run Python plugin tests using tox. Use when asked to run Python tests, unit tests for a plugin, or tox commands.
---

# Running Python Tests

Use `tox` from the plugin directory.

## Commands

```bash
# Run tests for a plugin
cd plugins/<plugin>
tox -e py3.12
```

## Run specific test

```bash
tox -e py3.12 -- test.deephaven.ui.test_utils.UtilsTest.test_create_props -v
```

## Common plugins with tests

- `plugins/ui`
- `plugins/plotly-express`

## Notes

- Assumes Python `.venv` is already sourced (`source .venv/bin/activate`)
- First run creates tox environment (~30s setup)
- Use `-v` flag for verbose output to see individual test names
- If tox env is corrupted, delete `plugins/<plugin>/.tox/` and retry
