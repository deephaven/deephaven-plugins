---
applyTo:
  - "plugins/**/docs/**/*.md"
---

# Documentation review

- Review documentation changes as a technical writer familiar with this repository.
- When Python API surface changes (new public functions, new parameters, removed or renamed parameters), verify that a corresponding doc page exists or is updated.
- Check that every doc page covering a public Python API ends with an `## API Reference` section using the `.. dhautofunction::` RST directive, matching the pattern in existing pages (e.g. `plugins/ui/docs/components/button.md`, `plugins/plotly-express/docs/bar.md`).
- Check that the doc has at least one runnable `## Example` (or `## Examples`) section with a Python code block showing typical usage.
- Ensure code examples follow the established import style: `from deephaven import ui` for `deephaven-ui` components/hooks, `import deephaven.plot.express as dx` for plotly-express.
- Each code example should end with a top-level variable assignment (e.g. `btn = ui.button(...)`) so the result is visible in the Deephaven console.
- Section headings should use sentence case (`## API reference`, not `## API Reference`) — check for consistency with the rest of the doc file and the surrounding plugin's docs.
- Flag docs that describe behaviour without a working code example, or that duplicate prose already covered in the API docstring without adding new context.
- Do not flag minor wording or punctuation issues unless they cause genuine confusion.
