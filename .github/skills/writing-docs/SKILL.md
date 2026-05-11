---
name: writing-docs
description: Write documentation. Use when asked to write documentation, update docs, or build plugin docs.
---

## Documenting Functions

For plugins that support it (indicated by the presence of a `make_docs.py` file, e.g. `plugins/ui/make_docs.py` or `plugins/plotly-express/make_docs.py`), document functions using the `dhautofunction` directive rather than building any table or description manually.

The functions themselves should be fully documented with docstrings in the source code. Parameters with multiple lines in their description should use an indented block after the first line.

### Example

````markdown
## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.use_navigate
```
````

Use the fully qualified Python path to the function as the argument to `dhautofunction`. This automatically generates the function signature, parameters, return type, and description from the source docstring.

## Document Structure

Follow this consistent structure when writing docs for components or hooks:

1. **H1 title** — short name of the component or hook
2. **Brief description** — one or two sentences explaining what it does and when to use it
3. **`## Example`** — a minimal, runnable code example
4. **Screenshot** (components only) — `![Alt text](../_assets/component_name.png)`
5. **`## UI recommendations`** (components) or **`## Recommendations`** (hooks) — numbered list of best practices and usage guidance
6. **Additional sections** — more examples showing advanced usage, data sources, variants, etc.
7. **`## API Reference`** — always last, using `dhautofunction`

For plotly-express chart docs, use `## What are X useful for?` with bullet points in place of a recommendations section.

## File Placement

- Component docs: `plugins/ui/docs/components/<component_name>.md`
- Hook docs: `plugins/ui/docs/hooks/<hook_name>.md`
- Plot docs: `plugins/plotly-express/docs/<chart_name>.md`

## Code Block Annotations

Docs use MyST Markdown (`.md` files with embedded RST directives). Python code blocks support two special annotations:

- `order=var1,var2,...` — controls which variables are shown in Deephaven and in what order. Variables prefixed with `_` are hidden (useful for intermediate tables or setup code that shouldn't be displayed).
- `skip-test` — excludes the code block from automated testing (use sparingly, e.g. for pseudocode or illustrative snippets).

Example:

````markdown
```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()
line_plot = dx.line(my_table, x="Timestamp", y="Price")
```
````

## Cross-References

Link to other docs using relative markdown paths:

```markdown
Consider using [`action_button`](./action_button.md) for task-based actions.
```

## Screenshots

Component screenshots are stored in `plugins/ui/docs/_assets/` and named descriptively (e.g. `button_basic.png`). Reference them with a relative path from the component doc:

```markdown
![Button Basic Example](../_assets/button_basic.png)
```
