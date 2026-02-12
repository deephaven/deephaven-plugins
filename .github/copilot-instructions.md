# Deephaven Plugins Development

## Testing Skills

- [Python Tests](skills/python-tests/SKILL.md) - Run plugin Python tests with tox
- [E2E Tests](skills/e2e-tests/SKILL.md) - Run Playwright tests in Docker
- [JS Tests](skills/js-tests/SKILL.md) - Run Jest unit tests

## Build Skills

- [Build Plugin](skills/build-plugin/SKILL.md) - Build and install plugins with plugin_builder.py

## Quick Reference

| Task          | Command                                                             |
| ------------- | ------------------------------------------------------------------- |
| Build plugin  | `source .venv/bin/activate && python tools/plugin_builder.py --reinstall <plugin>` |
| Python tests  | `source .venv/bin/activate && cd plugins/<plugin> && tox -e py3.12` |
| E2E tests     | `npm run e2e:docker -- ./tests/<file>.spec.ts --reporter=list`      |
| JS unit tests | `npm run test:unit -- --testPathPattern="plugins/<plugin>"`         |
