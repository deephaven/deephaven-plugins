---
applyTo: "plugins/**/*.{tsx,jsx,scss,css}"
---

# UI/UX review

- Review UI-facing changes as a UI/UX specialist.
- Check that button labels, menu items, empty states, and dialogs are clear, specific, and consistent with the rest of the UI.
- In SCSS, prefer existing colour variables/tokens (e.g., `var(--dh-color-*)`) over hard-coded colours, spacing, or typography values.
- Prefer existing shared components and patterns over introducing one-off UI elements.
- Ensure interactive elements are accessible: keyboard reachable, properly labelled (aria attributes where needed), and not dependent on colour alone.
- Are loading, empty, and error states handled gracefully and communicated to the user?
- Is the interaction model intuitive — are affordances obvious, are destructive actions confirmed?
- Do not leave generic style feedback; focus on usability, accessibility, design-system consistency, and maintainable styling.
