# DH-23822 — Stable panel ids for deephaven.ui dashboards

Found while investigating DH-23490. PR #1426.

## Problem

When a script adds, removes or reorders panels, a saved dashboard reopens with panels in the wrong places: a plot's
tab shows a table, and rollup tables show the next panel's content. Refreshing or discarding changes doesn't help.
Only closing and re-opening the widget does.

## Root cause

- `usePanelManager.getPanelId()` hands out saved `panelIds` by render order. A panel inserted early takes the next
  panel's id, and every later panel shifts by one. Each shifted panel opens in its predecessor's layout slot, with its
  predecessor's `panelStates`.
- `ReactPanel` only renamed a tab when the title changed during a session, so a panel that reused a slot kept the
  stale title.

## Design

Panels are identified by `key`, the way React identifies list items. A keyed panel keeps its id, layout slot and state
wherever the script inserts, removes or reorders panels. An unkeyed panel keeps the positional behavior. `__dhId`
isn't used for identity: it contains sibling indices, so it shifts too.

### Panel identity

- A panel is keyed when the `ui.panel` itself has a `key`. A component's `key` doesn't count.
- Its identity is the keys of the keyed `ui.row` / `ui.column` / `ui.stack` elements around it, followed by its own
  key, stored as `JSON.stringify(path)`. Unkeyed layout elements are skipped, so positions never enter the identity.
- The scope is one panel manager. A nested dashboard starts an empty scope.
- Examples:
  - `ui.stack(ui.panel(t, key="a"))` → `["a"]`
  - `ui.stack(ui.panel(t, key="a"), key="left")` → `["left", "a"]`
  - `my_card(t, key="a")` returning an unkeyed `ui.panel` → unkeyed, so positional

### Choosing a panel id

A `panelKeyMap` (identity → panel id) is saved alongside `panelIds`. The panel manager reads every panel in the
layout before it renders, and gives them all ids in one pure function (`layout/PanelIdUtils.ts`):

1. **Known id:** a keyed panel gets the id of its key. Within a session, an unkeyed panel keeps the id of its
   position.
2. **Saved ids in order:** unkeyed panels without an id take the saved ids that aren't in the map, in order. If no
   keys were saved (old data, or a script that just added keys), keyed panels take them too, so nothing moves when
   keys are first added. An unkeyed panel can't take a keyed panel's slot.
3. **New id:** derived from the panel's identity and a prefix unique to the panel manager.

The same layout and committed ids always give the same ids, so a repeated or discarded render can't change them. The
ids are committed after the render, and the ordered saved ids are used up by the first ready render. A second panel
with the same key gets a new id and a warning.

Each panel gets its id in the `__dhPanelId` prop. `Dashboard`, `Row`, `Column` and `Stack` each have a static
`getLayoutChildren` that returns the children they render, including the panels they wrap around bare content. They
use it when they render, and the manager uses it to find the panels, so the rules live in one place. A panel rendered
without an assigned id gets a new one and logs a warning, which makes a layout element missing `getLayoutChildren`
visible.

### Loading

- Until the document is ready, the unkeyed placeholders from `DashboardWidgetHandler` take every saved id in order,
  keyed ones included. Once it has been ready, every panel gets its id from the document.
- The saved `panelKeyMap` is kept until then, so a document that errors or never loads doesn't erase it. The ids are
  also kept while the document reloads.
- `ReactPanel` defers closing to a microtask and skips it if the id is open again, so a document panel that replaces a
  placeholder with the same id keeps its layout item.
- A panel's initial state is the latest `panelStates` entry for its id, and a stale tab title is renamed on open.

## Changes

### JS (`plugins/ui/src/js/src`)

- **`widget/WidgetTypes.ts`**, **`widget/WidgetUtils.tsx`**: `panelKeyMap` on the widget data, preserved like
  `panelIds`.
- **`widget/WidgetUtils.tsx`**: every mapped element with a `key` also gets `__dhKey`, a copy of its React key, since
  React doesn't pass `key` through as a prop. Fragments are skipped. Component nodes still return their children.
- **`layout/PanelIdUtils.ts`**: reads each panel's identity from the layout, resolves the ids, and passes each panel
  its id.
- **`layout/ReactPanel.tsx`**, **`layout/ReactPanelManager.ts`**: the panel opens with the id in `__dhPanelId`;
  `isOpen` for the deferred close.
- **`layout/usePanelManager.ts`**: takes the layout and returns it with each panel given its id; `syncOpenPanels`
  saves `panelKeyMap` from the open keyed panels.
- **`widget/DocumentHandler.tsx`**, **`layout/NestedDashboard.tsx`**: render the layout the panel manager returns.

### Python (`plugins/ui/src/deephaven/ui`)

- **`elements/FunctionElement.py`**: a keyed component sends `key`. It becomes part of its children's `__dhId`, so
  state inside a component that was already keyed resets once.
- **`_internal/utils.py`**: `validate_key` accepts `str`, `int`, `float`, `bool` or `None`.
- **`renderer/Renderer.py`**: `0` and `False` count as keys, and child state is stored under `str(key)` so it's found
  again after reload.

## Compatibility

- **Old saved data** has no `panelKeyMap`. The first load is positional, then the map is saved.
- **Adding keys to a script** works the same way, as long as all panels get keys in one change.
- **Dashboards that are already shifted** stay that way until the widget is re-opened or a key changes.
- **Removed panels** (DH-23775): a panel the document no longer renders is removed and its key drops out of the map.
  If it comes back, it's a new panel and loses its placement and state, as in React. This also applies within a
  session.

## Follow-ups

- `ui.dashboard(key=...)` to reset a nested dashboard's layout (separate PR).
- Docs: recommend keys on panels in lists, and add keys to every multi-panel example.
- Missing-key warning for lists: DH-23985.
- `useReactComponentKey()` in `@deephaven/dashboard`, reading the key from the React fiber, to replace `__dhKey`.
- Optionally, component keys in panel identity.
- Keep golden-layout in sync with the panels from one effect in the panel manager, instead of each `ReactPanel`
  opening and closing its own item.

## Reproducer

Covered by the DHE e2e test `web/client-ui/tests/uiDashboardPanelShift.spec.ts`.

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

Without the fix, the "Plot" tab shows the Account rollup and the plot opens in a second "Plot" panel. With it, every
tab keeps its content and "Raw" opens as a new tab. Without the `key`s the behavior is unchanged.
