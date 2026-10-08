# DH-23822 — Stable panel ids for deephaven.ui dashboards

Found while investigating DH-23490. Background: [DH-23822-context.md](DH-23822-context.md).

## Problem

When a script adds, removes or reorders panels, a saved dashboard reopens with panels in the wrong places: a plot's
tab shows a table, and rollup tables show the next panel's content. Refreshing or discarding changes doesn't help.
Only closing and re-opening the widget does.

## Root cause

- `usePanelManager.getPanelId()` hands out saved `panelIds` by render order. A panel inserted early takes the next
  panel's id, and every later panel shifts by one. Each shifted panel opens in its predecessor's layout slot, with its
  predecessor's `panelStates`.
- `ReactPanel` only renames a tab when the title changes during a session (`prevPanelTitleRef` starts as the current
  title), so a panel that reuses a slot keeps the stale title.
- Before DH-23527 the extra panel threw `HierarchyRequestError`; with the fix, the shift is silent.

## Approach

Identify panels by `key`, the way React identifies list items. A keyed panel keeps its id, layout slot and state
wherever the script inserts, removes or reorders panels. A panel without a key keeps today's positional behavior.

`__dhId` is not used for identity: it contains sibling indices and the outer panel's id, so it shifts too.

### Panel identity

- A panel's **own key path** is, outermost first:
  - the `key` of each component that renders the panel, e.g. `my_card(t, key="a")` where `my_card` returns a
    `ui.panel`;
  - the `key` on the `ui.panel` itself.
- A panel is **keyed** when its own key path is non-empty.
- Its **identity** is the key paths of the keyed `ui.row` / `ui.column` / `ui.stack` elements around it, followed by
  its own key path. Unkeyed layout elements are skipped, so positions never enter the identity.
- It is stored as `JSON.stringify(path)`, so keys containing separators can't collide.
- The scope is one panel manager: a top-level document or one dashboard. A nested dashboard starts an empty scope.
- Examples:
  - `ui.stack(ui.panel(t, key="a"), ...)` → `["a"]`
  - `ui.stack(ui.panel(t, key="a"), key="left")` → `["left", "a"]`
  - `[my_card(t, key=n) for n, t in tables]` → `[n]`; if `my_card`'s panel also has `key="main"` → `[n, "main"]`

### Choosing a panel id

`usePanelManager.getPanelId(panelKey?)`:

1. **No keyed entries saved yet** (`panelKeyMap` missing or empty, i.e. old data or a script that just added keys):
   every panel takes the next positional id from `panelIds`, as today. The map is saved after this load, so nothing
   moves when keys are first added.
2. **Keyed, in `panelKeyMap`:** the saved id.
3. **Keyed, not in `panelKeyMap`:** `nanoid()`. It's a new panel.
4. **Unkeyed:** the next id from `panelIds` that isn't a value in `panelKeyMap`, else `nanoid()`. An unkeyed panel can
   never take a keyed panel's slot, whatever the render order.
5. **Identity already handed out in this manager** (duplicate keys): `log.warn` and `nanoid()`. Never throw.

`getPanelId` runs during render, before `onOpen`, so track handed-out ids in a set and release an id on close. A keyed
panel that unmounts and returns in the same session gets its id back.

## Changes

### JS (`plugins/ui/src/js/src`)

1. **`widget/WidgetTypes.ts`**: add `panelKeyMap?: Record<string, string>` (identity → panel id) to `WidgetData`.
   Keep `panelIds`: `DashboardPlugin` closes panels from it, and the placeholders are built from it.
2. **`widget/WidgetUtils.tsx`**:
   - Add `panelKeyMap` to `PRESERVED_DATA_KEYS`.
   - `getComponentForElement`: React consumes `key`, so for panel, row, column and stack elements with a key, also
     pass `__dhKeyPath: [String(key)]`.
   - Component nodes (no mapped component; their children are returned directly): when the node has a `key`
     (Python change 9), clone each panel/row/column/stack child with the key prepended to its `__dhKeyPath`. For a
     single child, also set it as the child's React key, so React matches list items by the component key.
   - `transformNode` is unchanged: a component's key becomes part of its children's `__dhId`, as it already does for
     built-in elements, so state saved inside a keyed component follows the key.
3. **New `layout/PanelKeyScopeContext.ts`**: a `string[]` context, default `[]`.
   - `Row`, `Column` and `Stack` provide `[...scope, ...__dhKeyPath]` when they have a key path, in both the layout
     branch and the rehydration branch (`initialLayoutConfig != null`). The in-panel `Flex` branch needs nothing.
   - `NestedDashboardContent` resets it to `[]`.
   - Panels added by `normalizeStackChildren` / `wrapBareChildrenInPanel` are unkeyed and stay positional.
4. **`layout/ReactPanelManager.ts`**: `getPanelId(panelKey?: string)`, `onOpen(panelId, panelKey?)` and
   `useReactPanel(panelKey?)`.
5. **`layout/ReactPanel.tsx`**:
   - Accept `__dhKeyPath`. When it's non-empty, build the identity from the scope context and pass it to
     `useReactPanel`.
   - Start `prevPanelTitleRef` empty, so the tab title is set on the first open, including on rehydration.
6. **`layout/usePanelManager.ts`**:
   - Resolve ids as above.
   - `syncOpenPanels` saves `panelKeyMap`, built from the open keyed panels, alongside `panelIds`. Entries for panels
     that didn't open drop out of the map, which matches what `removeOrphanedPanels` does for `panelStates`.
   - `removeOrphanedPanels` drains the positional pool, as it does today with `panelIdIndex`.
7. **`widget/DashboardWidgetHandler.tsx`**: build the placeholders from `panelIds` in order. For an id in
   `panelKeyMap`, render `<ReactPanel key={path[0]} __dhKeyPath={path} />`; leave the others unkeyed. A root-level
   panel has no layout scope, so `path[0]` is the same React key the real document uses, and React reuses the
   placeholder instead of closing and re-opening it.
   **Test first:** cover today's behaviour for a document whose root is a list of panels and one whose root is
   `ui.dashboard`, to confirm whether placeholders are reused or unmounted in each case.

### Python (`plugins/ui/src/deephaven/ui`)

8. **`components/dashboard.py`** and **`elements/DashboardElement.py`**: add `key: str | None = None` and pass it to
   `BaseElement`. A new key resets a nested dashboard's saved layout, because `NestedDashboardData` is keyed by
   `__dhId`. It has no effect on a top-level dashboard's saved panels.
9. **`elements/FunctionElement.py`**: `render()` sends `key` when the component has one. State saved inside a
   component that was already keyed resets once on upgrade, because its children's `__dhId` now includes the key.
10. **Missing-key warning:** out of scope for this ticket and tracked separately. Python can't tell hand-written
    children from a spread list (`ui.flex(a, b)` vs `ui.flex(*items)`), so it needs more design.

### Docs

11. Dashboard docs:
    - give every panel in a list a `key`, and put the key on the component when a component renders the panel;
    - keys on `ui.row` / `ui.column` / `ui.stack` scope the keys inside them;
    - changing a key, or moving a keyed panel into a differently keyed layout element, makes it a new panel, which
      loses its slot and state;
    - add keys to all panels at once (see Compatibility);
    - `ui.dashboard(key=...)` resets a nested dashboard's layout.
12. **TODO:** add keys to every multi-panel example in `plugins/ui/docs` and regenerate the affected snapshots.

## Compatibility

- **Old saved data** has no `panelKeyMap`. The first load uses today's positional behaviour, then saves the map;
  later loads are stable.
- **Adding keys to an existing script** works the same way, as long as all panels get keys in one change. A keyed
  panel added when the map already has keyed entries is treated as new.
- **Dashboards that are already shifted** stay that way until the user re-opens the widget or the script changes a
  key.
- **Scripts that already key panels:** `__dhId` and React keys are unchanged.
- **Component keys** now become React keys for the panels they render. This only affects reconciliation at runtime.

## Related: DH-23775 (remove orphan panels, now on main)

DH-23775 removes saved panels that the current document no longer renders: `usePanelManager.removeOrphanedPanels`
removes their layout items and drops their `panelStates` after the first sync once the document is ready.

The two changes fix different halves of the same problem:

- **Stable ids alone:** a removed panel's slot is still left blank, but at least it's the right slot.
- **DH-23775 alone:** the blank slot is removed, but it's the *last* slot. Every panel after the removed one has
  already moved one place.
- **Both together:** each remaining panel keeps its own slot, title and state, and only the removed panel's slot
  goes.

A conditional panel that's skipped on one load is removed from the layout and its key drops out of `panelKeyMap`.
When it comes back it gets a fresh id, so its placement and grid state are lost. The docs should recommend a fixed
set of panels.

## PR order

1. **PR #1419**: hook-state restore (Python only). Independent of the others.
2. **`ui.dashboard(key=...)`** (change 8): small and Python only. It gives customers a supported way to reset a
   layout before the stable-id fix ships.
3. **Stable panel ids** (this plan, changes 1–7 and 9–11).
4. **Docs examples** (TODO 12). Can follow separately.

## Tests

- **`usePanelManager.test.ts`**:
  - a keyed panel gets its saved id;
  - a keyed panel inserted before others leaves every other id unchanged;
  - an unkeyed panel never takes a keyed panel's id, whichever renders first;
  - old data, and an empty map with newly added keys, fall back to positional ids and save the map;
  - a duplicate identity logs a warning and gets a new id;
  - an id is released on close and reused when the same key re-opens;
  - orphaned panels drop out of `panelKeyMap`.
- **`WidgetUtils.test.tsx`**:
  - `__dhKeyPath` on keyed panel, row, column and stack elements;
  - a component's `key` is prepended to its children's paths and becomes a single child's React key;
  - a component's `key` is part of its children's `__dhId`.
- **`ReactPanel.test.tsx`**:
  - the identity is built from the scope and the panel's own path;
  - a rehydrated panel with a stale layout title is renamed.
- **`Row` / `Column` / `Stack` tests**: the scope is provided in both the layout and the rehydration branch.
- **`DashboardWidgetHandler.test.tsx`**: keyed placeholders are reused by keyed real panels, with no close and
  re-open.
- **Python**:
  - `FunctionElement` sends `key` only when it has one;
  - the renderer warns once for a list of two unkeyed panels, and not for keyed panels, component-keyed panels or a
    single panel;
  - `ui.dashboard(key=...)`.
- **e2e**: the reproducer below. Open the dashboard, set `ADD_PANEL = True`, reload, and check that every tab keeps
  its content.

## Reproducer

```python
from deephaven import agg, empty_table, ui
from deephaven.plot.figure import Figure

ADD_PANEL = False  # set to True before restarting the PQ

src = empty_table(100).update(
    [
        "USym = `SYM` + (i % 7)",
        "Account = `ACC` + (i % 5)",
        "X = i",
        "Y = Math.sin(i / 10.0)",
    ]
)
by_usym = src.rollup(aggs=[agg.sum_("Y")], by=["USym"])
by_account = src.rollup(aggs=[agg.sum_("Y")], by=["Account"])
plot = Figure().plot_xy(series_name="Y", t=src, x="X", y="Y").show()


@ui.component
def panel_shift():
    tabs = [ui.panel(by_usym, title="By USym", key="usym")]
    if ADD_PANEL:
        tabs.append(ui.panel(src, title="Raw", key="raw"))
    tabs += [
        ui.panel(by_account, title="By Account", key="account"),
        ui.panel(plot, title="Plot", key="plot"),
    ]
    return ui.panel(ui.dashboard(ui.stack(*tabs)), title="Panel shift repro")


panel_shift_repro = panel_shift()
```

Today the "Plot" tab shows the Account rollup, and the plot opens in a second "Plot" panel. With the fix, every tab
keeps its content and "Raw" opens as a new tab.

Without the `key`s the behavior is unchanged from today.
