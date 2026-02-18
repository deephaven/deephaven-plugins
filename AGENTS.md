# Deephaven Plugins Development

## Important

When creating a new terminal, ALWAYS source the virtual environment before running any other commands:

```bash
source .venv/bin/activate
```

## Testing Skills

- [Python Tests](./.github/skills/python-tests/SKILL.md) - Run plugin Python tests with tox
- [E2E Tests](./.github/skills/e2e-tests/SKILL.md) - Run Playwright tests in Docker
- [JS Tests](./.github/skills/js-tests/SKILL.md) - Run Jest unit tests

## Build Skills

- [Build Plugin](./.github/skills/build-plugin/SKILL.md) - Build and install plugins with plugin_builder.py

## Quick Reference

| Task          | Command                                                        |
| ------------- | -------------------------------------------------------------- |
| Build plugin  | `python tools/plugin_builder.py --reinstall <plugin>`          |
| Python tests  | `cd plugins/<plugin> && tox -e py3.12`                         |
| E2E tests     | `npm run e2e:docker -- ./tests/<file>.spec.ts --reporter=list` |
| JS unit tests | `npm run test:unit -- --testPathPattern="plugins/<plugin>"`    |
