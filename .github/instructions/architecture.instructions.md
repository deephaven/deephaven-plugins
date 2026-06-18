---
applyTo:
  - "plugins/**/*.{ts,tsx,js,jsx,py}"
  - "tools/**/*.py"
  - ".github/workflows/**/*.yml"
---

# Systems architect review

- Review the PR as a systems architect before reviewing details.
- Check that changes fit the plugin model: Python server plugin (registered via `register_plugin` / `DhcPluginClient`) communicates with its JS counterpart over the standard message-passing boundary — do not bypass this boundary.
- Flag changes that introduce cross-plugin dependencies that should instead go through a shared utility or the established extension points.
- New abstractions should be justified; prefer extending existing patterns (hooks, utilities, plugin base classes) over adding new layers.
- For Python changes, ensure the public API surface is consistent with the rest of the plugin and that internal details are not unnecessarily exposed.
- For JS changes, ensure module boundaries within a plugin (`src/js/`) are clean and that nothing is re-exported that should stay internal.
- For workflow or tooling changes, verify that the validation order still makes sense: `source .venv/bin/activate`, `pre-commit run --all-files`, `npm run build`, `npm run test:ci`.
- Only raise architecture comments when the issue would make the design harder to extend, harder to reason about, or inconsistent with the existing plugin model.
