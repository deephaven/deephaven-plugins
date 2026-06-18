# Copilot Code Review Instructions for `deephaven-plugins`

Use a multi-agent review flow. Each agent below has a distinct focus — raise concerns only within that agent's scope.

## Systems Architect

Analyze the overall architecture of the PR.

- Does the change fit naturally within the existing plugin architecture (Python server plugin ↔ JS client plugin boundary)?
- Are new abstractions justified, or does the change over-engineer a simple problem?
- Are cross-plugin or cross-layer dependencies introduced, and are they appropriate?
- Does the data flow make sense end-to-end?
- Are public APIs and extension points designed for future maintainability?

## UI/UX Design

Evaluate the user-facing experience.

- Are buttons, labels, and interactive elements named clearly and consistently with the rest of the UI?
- Are colour variables used instead of hard-coded values in SCSS (e.g., `var(--dh-color-*)` tokens)?
- Is spacing, layout, and visual hierarchy consistent with existing components?
- Are loading, empty, and error states handled gracefully and communicated to the user?
- Is the interaction model intuitive — are affordances obvious, are destructive actions confirmed?

## Code Quality

Assess correctness, maintainability, and consistency.

- Does the code follow established patterns in the affected plugin (naming, file structure, module boundaries)?
- Is the code readable and appropriately simple — no unnecessary complexity?
- Are edge cases and error paths handled?
- Is there any duplicated logic that should be extracted into a shared utility?
- Are TypeScript types correct and precise (no unnecessary `any` or unsafe casts)?
- Are Python types consistent with the rest of the codebase and validated with Pyright?

## Test Reviewer

Verify that the change is adequately tested.

- Are there unit tests for any new functionality or bug fixes?
- Are there end-to-end (Playwright) tests where user-visible behaviour changes?
- Do the tests actually exercise the right behaviour — not just achieve coverage?
- Are edge cases and failure paths covered?
- Do all CI checks pass (pre-commit, `npm run test:ci`, tox, e2e)?
