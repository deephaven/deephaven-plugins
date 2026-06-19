---
applyTo: "plugins/**/*.ts, plugins/**/*.tsx, plugins/**/*.js, plugins/**/*.jsx, plugins/**/*.py"
---

# Code quality review

- Review changed source as a code quality specialist.
- Check that the change matches established patterns in the same plugin before recommending a new abstraction.
- Prefer focused functions/components, descriptive names, and clear data flow over clever or overly dense logic.
- Flag copy/pasted logic when an existing utility, hook, or component would be a better fit.
- Check for maintainable error handling and cleanup, especially around async code, event listeners, and subscriptions.
- In TypeScript/React code, ensure types are correct and precise — avoid unnecessary `any` or unsafe casts; prefer patterns already used nearby for hooks, props, and state ownership.
- In Python code, ensure types are consistent with the rest of the plugin and that Pyright would accept them (`pre-commit run --all-files` runs Pyright).
- Avoid nitpicks about formatting or trivial style unless they hide a real maintenance problem.
