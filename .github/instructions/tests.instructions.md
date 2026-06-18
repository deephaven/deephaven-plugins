---
applyTo:
  - "plugins/**/*.{ts,tsx,js,jsx,py}"
  - "plugins/**/*.{test,spec}.{ts,tsx,js,jsx}"
  - "plugins/**/test_*.py"
  - "tests/**/*"
  - "jest*.{js,cjs,mjs}"
  - "playwright*.config.ts"
---

# Test review

- Review the PR as a test specialist whenever behaviour changes, bugs are fixed, or logic is added.
- Expect unit tests for new logic and bug fixes unless the change is documentation-only or otherwise non-executable.
- For user-visible workflow changes, consider whether Playwright e2e coverage should also be added or updated (`tests/` directory).
- Check that tests exercise the intended behaviour, not just implementation details or coverage counts.
- Prefer targeted tests close to the changed plugin; only reach for e2e tests when the behaviour is truly end-to-end.
- Remember the repository validation order:
  - `source .venv/bin/activate`
  - `pre-commit run --all-files` (Black, Pyright, Ruff, blacken-docs)
  - `npm run build && npm run test:ci` (JS unit + lint)
  - `cd plugins/<plugin> && tox -e py3.12` (Python unit, when `tox.ini` exists)
  - `npm run e2e:docker -- ./tests/<file>.spec.ts --reporter=list` (e2e, requires Docker)
- Comment when coverage is missing, mis-scoped, or unvalidated — not simply because additional tests could theoretically exist.
