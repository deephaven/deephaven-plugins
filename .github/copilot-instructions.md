# Copilot Instructions for `deephaven-plugins`

See [`AGENTS.md`](../AGENTS.md) for environment setup, available skills, build/test commands, and repo conventions.

## Code review workflow

Treat code review as a multi-pass workflow and only comment when you find a concrete, actionable issue.
These "passes" describe a review process (specialized lenses), not separate runtime agents.
When a PR opens, execute this checklist in order within the review session: load `AGENTS.md`, map changed files to relevant instruction files, run only applicable passes, then publish consolidated high-signal findings.

Run these specialist passes in order when they apply to the changed files:

1. **Systems architect**: check whether the PR fits the existing plugin architecture (Python server plugin ↔ JS client plugin boundary), abstraction level, and data flow.
2. **UI/UX reviewer**: for UI changes, check labels, colour variables, accessibility, and SCSS token usage.
3. **Code quality reviewer**: check maintainability, consistency with nearby patterns, error handling, and clean scoping.
4. **Test reviewer**: for behaviour changes, verify that the right unit and/or e2e coverage exists and that CI checks pass.

Skip passes that do not apply to the touched files rather than forcing generic feedback.
Prefer a few high-signal findings over many style comments.

Use the path-specific instruction files in `.github/instructions/` to deepen each pass:

- `architecture.instructions.md`
- `ui-ux.instructions.md`
- `code-quality.instructions.md`
- `tests.instructions.md`
