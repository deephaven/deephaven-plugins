# DH-21476: Pivot Builder — Rollup/Aggregate/Pivot config UI

## TL;DR

Add a card-based configuration panel above the existing column selectors on
the Pivot Builder Table Options sidebar page (see
[`CreatePivotPage.tsx`](../plugins/pivot-builder/src/js/src/CreatePivotPage.tsx)).
The new panel mirrors the design in the attached mockup
("Rollup, Aggregate and Pivot") and is the eventual replacement for the
existing Rollups & Aggregations sidebar.

This first pass is **UI-only with mock data**: state is local to the page,
no wiring to `pivotConfig` / `rollupConfig` / model setters. The existing
column-selector UI and Apply/Reset buttons stay intact below the new
section so the page remains functional.

## Visual structure (top-to-bottom)

1. **Rollup rows** card
   - Header row: title `Rollup rows`, ON/OFF toggle (right), `Add` button.
   - Body: vertical list of selected column chips, each row showing the
     column name with a drag-handle (`vertical-grip` / `dots`) icon and a
     trash icon.
   - Mock seed: `["Sym", "Exchange"]`.
2. **Pivot columns** card — same shape as Rollup rows. Mock seed: `[]`.
3. **Aggregate values** card — same shape, with one extra per-row icon:
   - Each row shows e.g. `Sum (Price, Size)` with **edit** (pencil),
     drag-handle, and trash icons.
   - Mock seed: `[{ fn: "Sum", columns: ["Price", "Size"] }]`.
4. **Add filterable columns** card — same shape as Rollup rows. Mock
   seed: `[]`.
5. **Footer checkboxes** (outside any card):
   - `Include constituents in rollups rows` (checked by default)
   - `Non-aggregated in rollup rows` (checked by default)

Below this panel: render the **existing** Row keys / Column keys /
Aggregation function / Columns selectors and Apply/Reset buttons
unchanged.

## Behaviour for this pass

- The ON/OFF toggles, `Add` buttons, edit/reorder/delete icons, and the
  two checkboxes are wired only to local `useState` (no model effects).
- `Add` on Rollup rows / Pivot columns / Filterable columns appends a
  placeholder entry (e.g. picks the next unused column name from
  `model.sourceTable.columns`, falling back to `"Column N"`).
- `Add` on Aggregate values appends a placeholder
  `{ fn: "Sum", columns: [<first numeric column or "Value">] }`.
- Trash removes; drag-handle is a non-functional visual cue for now.
- Edit (pencil) on an aggregate row is a no-op stub
  (`log.info('Edit aggregate', entry)`).
- Toggling a card OFF should visually collapse / dim its body but keep
  the entries in state (simplest: render the body only when ON).

## Files

### New

- `plugins/pivot-builder/src/js/src/PivotConfigSection.tsx` — the whole
  card-based panel. Exports `<PivotConfigSection />` and internal
  `<ConfigCard />` plus row-item subcomponents. Pure, props-driven from
  the `CreatePivotPage` parent.

### Modified

- `plugins/pivot-builder/src/js/src/CreatePivotPage.tsx`
  - Import and render `<PivotConfigSection />` at the top of the
    page's flex column, above the existing `Row keys` block.
  - Add local `useState` for the four card sections and the two footer
    checkboxes (mock-data seeds described above).
  - No changes to `handleApply` / `handleReset` / existing selectors.

## Implementation notes

- Use `@deephaven/components` primitives only:
  - `Button` for `Add` (`kind="ghost"` or `kind="secondary"`, small).
  - `Checkbox` for the footer toggles and (if needed) the ON/OFF
    indicators — actually the mockup shows a pill-style switch; use the
    existing `Switch` from `@adobe/react-spectrum` re-export in
    `@deephaven/components` if available, otherwise fall back to a
    styled `Checkbox`. Verify exports before coding; if neither is
    suitable, render a plain `<button role="switch" aria-checked>` and
    style with CSS classes.
  - `@deephaven/icons` for `dhTrash`, `vsEdit` (pencil), and a grip /
    drag handle. Pick whichever already-exported icons match closest;
    do not add new icons.
- Keep styling consistent with the existing `iris-grid-plugin-sidebar-page`
  class. Inline styles are acceptable for the spike (matches what
  `CreatePivotPage.tsx` already does), but group the card chrome
  (border, header row, body) into a single `ConfigCard` subcomponent so
  the four sections share it.
- TypeScript: define a small local module type for an aggregate entry
  (`type AggregateEntry = { id: string; fn: string; columns: string[] }`)
  and string lists for the other three sections. `id` via `crypto.randomUUID()`
  (already available in the browser target).
- No new dependencies. No CSS files; reuse existing CSS variables for
  borders / spacing where convenient.

## Out of scope (explicit non-goals)

- Wiring the new UI to `pivotConfig`, `rollupConfig`, or any model
  setter. The existing selectors remain the only path that drives the
  pivot model.
- Column picker dialogs for `Add` / edit — placeholder behaviour only.
- Drag-and-drop reordering. The grip icon is decorative.
- Validation (e.g. preventing the same column in Rollup rows and Pivot
  columns).
- Persisting the new UI state across page open/close.
- Tests, Python package changes, styling polish.

## Phases & Steps

### Phase 1 — Mock UI scaffold

1. Create `PivotConfigSection.tsx` with `ConfigCard`, `ColumnRow`, and
   `AggregateRow` subcomponents. Render mocked seed data from props.
2. Add controlled props for each section's list + setter, the ON/OFF
   flag + setter, and the two footer checkbox flags + setters.
3. Wire `Add` / trash / edit callbacks per section. Edit is a logged
   no-op.

### Phase 2 — Integrate into `CreatePivotPage`

1. Add the four `useState` lists, four ON flags, and two checkbox
   flags to `CreatePivotPage`. Seed with the mock data above.
2. Render `<PivotConfigSection />` above the existing
   `Row keys` block, inside the same outer flex column.
3. Leave the rest of `CreatePivotPage` (selectors, Apply, Reset,
   error display) unchanged.

### Phase 3 — Visual pass

1. Verify in the running app (DHE + plugins proxy) that the new
   section renders, toggles, and add/remove behave correctly with
   mock data.
2. Adjust spacing / borders to roughly match the mockup. No pixel-
   perfect polish.

## Risks / open questions

- Whether `@deephaven/components` already exports a `Switch` that
  matches the mockup's pill toggle. If not, the spike will use a
  styled `Checkbox` — flag this for the follow-up that wires real
  behaviour.
- Icon names: confirm what's exported from `@deephaven/icons` for
  the drag handle (`vsGripper`, `dhGripVertical`, …). Pick the
  closest match; do not add new SVGs in this pass.
