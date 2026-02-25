# DH-19818: Nested Dashboards Implementation Plan

## Overview

Currently, `ui.dashboard` can only be created at the top level of a script and cannot be nested inside a `ui.panel` or another dashboard. This plan outlines the approach to enable nested dashboards, allowing users to embed full dashboard layouts within panels.

## Current Architecture

### Python Side

- `DashboardElement` ([DashboardElement.py](../plugins/ui/src/deephaven/ui/elements/DashboardElement.py)) wraps a `FunctionElement` and registers with type `deephaven.ui.components.Dashboard`
- The `dashboard()` function ([dashboard.py](../plugins/ui/src/deephaven/ui/components/dashboard.py)) creates a `DashboardElement`
- Dashboards are typed as `DASHBOARD_ELEMENT = 'deephaven.ui.Dashboard'` on the wire

### JavaScript Side

#### Top-Level Dashboard Flow

1. **DashboardPlugin** ([DashboardPlugin.tsx](../plugins/ui/src/js/src/DashboardPlugin.tsx)):

   - Listens for `PanelEvent.OPEN` events
   - When a `DASHBOARD_ELEMENT` is opened, calls `emitCreateDashboard()` to create a new browser tab
   - Each tab has its own GoldenLayout root and isolated widget management

2. **Dashboard Component** ([Dashboard.tsx](../plugins/ui/src/js/src/layout/Dashboard.tsx)):

   - Normalizes children (ensures single root row/column)
   - Passes through `ParentItemContext` for GoldenLayout parent tracking
   - Currently does NOT create its own GoldenLayout - relies on the layout manager provided by `DashboardPlugin` via context

3. **Layout Components** ([Row.tsx](../plugins/ui/src/js/src/layout/Row.tsx), [Column.tsx](../plugins/ui/src/js/src/layout/Column.tsx), [Stack.tsx](../plugins/ui/src/js/src/layout/Stack.tsx)):

   - Create GoldenLayout `ContentItem` nodes attached to parent
   - `Row` and `Column` detect when inside a panel and render as `Flex` instead

4. **ReactPanel** ([ReactPanel.tsx](../plugins/ui/src/js/src/layout/ReactPanel.tsx)):
   - Creates GoldenLayout panels via `LayoutUtils.openComponent()`
   - Throws `NestedPanelError` if already inside a panel (checked via `usePanelId()`)
   - Provides `ReactPanelContext` to children

### Current Constraints Preventing Nesting

| Location                                                                      | Constraint                                                                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [ReactPanel.tsx#L127-130](../plugins/ui/src/js/src/layout/ReactPanel.tsx)     | Throws `NestedPanelError` if `contextPanelId != null`                             |
| [DocumentUtils.tsx#L45-47](../plugins/ui/src/js/src/widget/DocumentUtils.tsx) | Throws `MixedPanelsError` if dashboards and panels are mixed at root              |
| [DashboardPlugin.tsx#L97-112](../plugins/ui/src/js/src/DashboardPlugin.tsx)   | `handleDashboardOpen` emits create dashboard event (new tab) instead of embedding |
| [dashboard.md#L27](../plugins/ui/docs/components/dashboard.md)                | Documentation rule: "Dashboards must be a child of the root script"               |

## Proposed Solution

### Option A: Nested GoldenLayout Instance (Recommended)

Enhance the existing `Dashboard` component to create its own GoldenLayout instance when nested inside a panel. The same component works at both top-level and when nested.

#### Advantages

- Full dashboard feature parity (drag/drop, resize, stack tabs)
- Isolated state management (nested dashboard has its own layout manager)
- Consistent user experience with top-level dashboards
- Single `Dashboard` component handles both cases - no separate "nested" versions

#### Disadvantages

- Need to handle GoldenLayout lifecycle within React component
- Resize synchronization between parent panel and nested layout

### Option B: Static Grid Layout

Render nested dashboard content using a grid-based layout (CSS Grid or Flex) without GoldenLayout integration.

#### Advantages

- Simpler implementation
- No GoldenLayout nesting complexity
- Lightweight rendering

#### Disadvantages

- No drag-and-drop panel rearrangement within nested dashboards
- Feature disparity between top-level and nested dashboards
- May not meet user expectations

### Option C: Tabs-Based Rendering

Convert nested dashboard stacks to `ui.tabs` and layout to `ui.flex`/`ui.grid`.

#### Advantages

- Reuses existing components
- Simpler state management

#### Disadvantages

- Significant behavior difference from top-level dashboards
- Loss of panel drag-and-drop functionality

## Recommended Implementation: Option A

The key insight is that `Dashboard` should manage its own GoldenLayout instance. Currently, the `DashboardPlugin` creates the GoldenLayout when opening a new browser tab, and `Dashboard` just uses that via context. For nested dashboards, `Dashboard` needs to create its own GoldenLayout when it detects it's inside a panel. The same component handles both cases - top-level (uses parent layout) and nested (creates own layout).

### Phase 0: Test-First Development (Start Here)

Write tests before implementation to define expected behavior and enable iterative development.

#### 0.1 E2E Tests (Playwright)

Create `tests/ui_nested_dashboard.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Nested Dashboards', () => {
  test('renders a dashboard inside a panel', async ({ page }) => {
    // Load test fixture with nested dashboard
    await page.goto('/');
    // Execute Python code that creates nested dashboard
    // Verify the nested dashboard renders with its panels
  });

  test('nested dashboard panels are draggable within nested layout', async ({
    page,
  }) => {
    // Create nested dashboard with multiple panels
    // Drag a panel tab within the nested dashboard
    // Verify panel moved to new position
  });

  test('nested dashboard panels cannot be dragged to parent dashboard', async ({
    page,
  }) => {
    // Attempt to drag nested panel outside nested dashboard bounds
    // Verify it stays within nested dashboard
  });

  test('nested dashboard state persists on page reload', async ({ page }) => {
    // Create nested dashboard
    // Rearrange panels
    // Reload page
    // Verify layout is restored
  });

  test('closing parent panel cleans up nested dashboard', async ({ page }) => {
    // Create nested dashboard inside a panel
    // Close the parent panel
    // Verify no orphaned state or errors
  });

  test('nested dashboard resizes with parent panel', async ({ page }) => {
    // Create nested dashboard
    // Resize parent panel
    // Verify nested dashboard and its panels resize appropriately
  });
});
```

#### 0.2 Unit Tests

Create `plugins/ui/src/js/src/layout/Dashboard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { ReactPanelContext } from './ReactPanelContext';
import {
  LayoutManagerContext,
  Dashboard as DHCDashboard,
} from '@deephaven/dashboard';

describe('Dashboard', () => {
  it('renders at top level with existing layout manager', () => {
    // Render Dashboard without panel context
    // Verify it uses parent layout manager's root
  });

  it('uses Dashboard from @deephaven/dashboard when nested in a panel', () => {
    // Render Dashboard inside ReactPanelContext
    // Verify it renders DHCDashboard component
  });

  it('normalizes children correctly', () => {
    // Test various child configurations
    // Verify proper wrapping in rows/columns
  });

  it('provides correct ParentItemContext to children', () => {
    // Verify children receive the dashboard's root as parent
  });

  it('cleans up dashboard on unmount', () => {
    // Render then unmount
    // Verify cleanup occurs properly
  });
});
```

Create `plugins/ui/src/js/src/layout/ReactPanel.test.tsx` additions:

```typescript
describe('ReactPanel in nested dashboard', () => {
  it('renders inside a nested dashboard without throwing NestedPanelError', () => {
    // The panel is inside Dashboard which resets the panel context
    // So it should not throw even though there's an outer panel
  });

  it('registers with the nested dashboard layout manager', () => {
    // Verify panel is added to nested GoldenLayout, not parent
  });
});
```

Create `plugins/ui/src/js/src/layout/NestedDashboard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import NestedDashboard from './NestedDashboard';
import { ReactPanelContext } from './ReactPanelContext';
import { useLayoutManager } from '@deephaven/dashboard';

describe('NestedDashboard', () => {
  it('creates an isolated GoldenLayout instance', () => {
    // Render NestedDashboard
    // Verify DHCDashboard is used and creates its own layout
  });

  it('resets ReactPanelContext to null', () => {
    // Render a panel inside NestedDashboard
    // Verify usePanelId() returns null inside the nested dashboard
  });

  it('provides PortalPanelManager for nested panels', () => {
    // Verify portal rendering works for nested panels
  });

  it('provides correct ReactPanelManagerContext', () => {
    // Verify panels can register with the nested panel manager
  });

  it('handles resize when parent container changes size', () => {
    // Verify layout updates when container resizes
  });
});
```

### Phase 1: Core Infrastructure

#### 1.1 Enhance `Dashboard` Component

The `Dashboard` component should:

1. Detect if it's inside a panel (via `usePanelId()`)
2. If nested: render `NestedDashboard` which uses `Dashboard` from `@deephaven/dashboard` with proper context providers
3. If top-level: use the existing layout manager's root (current behavior)

Update [Dashboard.tsx](../plugins/ui/src/js/src/layout/Dashboard.tsx):

```tsx
import { Dashboard as DHCDashboard } from '@deephaven/dashboard';
import NestedDashboard from './NestedDashboard';

function Dashboard({ children }: DashboardElementProps): JSX.Element | null {
  const contextPanelId = usePanelId();
  const isNested = contextPanelId != null;

  if (isNested) {
    return <NestedDashboard>{children}</NestedDashboard>;
  }

  // Top-level: existing behavior
  return <DashboardContent>{children}</DashboardContent>;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const parent = useParentItem();
  const normalizedChildren = normalizeDashboardChildren(children);
  return (
    <ParentItemContext.Provider value={parent}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}
```

#### 1.2 Create `NestedDashboard` Component

Create a new component that wraps the `Dashboard` from `@deephaven/dashboard` with all the necessary context providers:

```tsx
// plugins/ui/src/js/src/layout/NestedDashboard.tsx
import {
  Dashboard as DHCDashboard,
  useLayoutManager,
} from '@deephaven/dashboard';
import { ReactPanelContext } from './ReactPanelContext';
import {
  ReactPanelManagerContext,
  ReactPanelManager,
} from './ReactPanelManager';
import { ParentItemContext } from './ParentItemContext';
import PortalPanelManager from './PortalPanelManager';

interface NestedDashboardProps {
  children: React.ReactNode;
}

function NestedDashboard({ children }: NestedDashboardProps): JSX.Element {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* DHCDashboard creates GoldenLayout and registers widget plugins */}
      <DHCDashboard>
        <NestedDashboardContent>{children}</NestedDashboardContent>
      </DHCDashboard>
    </div>
  );
}

function NestedDashboardContent({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const layoutManager = useLayoutManager();
  const panelManager = useMemo(() => new ReactPanelManager(), []);
  const normalizedChildren = normalizeDashboardChildren(children);

  return (
    <PortalPanelManager>
      <ReactPanelManagerContext.Provider value={panelManager}>
        {/* Reset ReactPanelContext so nested panels don't throw NestedPanelError */}
        <ReactPanelContext.Provider value={null}>
          <ParentItemContext.Provider value={layoutManager.root}>
            {normalizedChildren}
          </ParentItemContext.Provider>
        </ReactPanelContext.Provider>
      </ReactPanelManagerContext.Provider>
    </PortalPanelManager>
  );
}

export default NestedDashboard;
```

The `NestedDashboard` component:

- Uses `DHCDashboard` from `@deephaven/dashboard` which creates and manages a GoldenLayout instance and registers widget plugins
- Wraps content in `PortalPanelManager` to manage portal-based panel rendering
- Provides `ReactPanelManagerContext` for panel lifecycle management
- Resets `ReactPanelContext` to `null` so nested panels don't see the outer panel's ID and throw `NestedPanelError`
- Sets `ParentItemContext` to the nested layout's root so child layout components attach to the correct GoldenLayout instance

#### 1.3 Update `ReactPanel` Context Check

Modify [ReactPanel.tsx](../plugins/ui/src/js/src/layout/ReactPanel.tsx) - the `NestedPanelError` check is correct, but `Dashboard` will reset the context when nested, so panels inside a nested dashboard won't see the outer panel's ID.

### Phase 2: State Management

#### 2.1 Panel ID Isolation

Each `Dashboard` (whether top-level or nested) manages its own panels. The `Dashboard` component from `@deephaven/dashboard` provides `PortalPanelManager` and handles panel registration for nested dashboards independently.

#### 2.2 Widget Data Flow

The nested dashboard's layout state is stored in the `panelState` of the parent panel using the `usePersistentState` hook. The layout config must be dehydrated before saving and hydrated when restoring, similar to how `UITable` handles `IrisGridState`:

```tsx
// In NestedDashboard component
function NestedDashboard({ children }: NestedDashboardProps): JSX.Element {
  // Store dehydrated layout config in parent panel's state
  const [dehydratedLayoutConfig, setDehydratedLayoutConfig] =
    usePersistentState<DehydratedLayoutConfig | undefined>(undefined, {
      type: 'NestedDashboard',
      version: 1,
    });

  // Keep initial state for hydration
  const initialDehydratedConfig = useRef(dehydratedLayoutConfig);

  // Memoized dehydration function to avoid unnecessary re-renders
  const dehydrateLayout = useMemo(() => makeLayoutDehydrator(), []);

  // Dehydrate and save when layout changes
  const handleLayoutChange = useCallback(
    (layoutConfig: LayoutConfig) => {
      setDehydratedLayoutConfig(dehydrateLayout(layoutConfig));
    },
    [dehydrateLayout, setDehydratedLayoutConfig]
  );

  // Hydrate initial state when mounting
  const initialLayoutConfig = useMemo(() => {
    if (initialDehydratedConfig.current != null) {
      return hydrateLayoutConfig(initialDehydratedConfig.current);
    }
    return undefined;
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DHCDashboard
        layoutConfig={initialLayoutConfig}
        onLayoutChange={handleLayoutChange}
      >
        <NestedDashboardContent>{children}</NestedDashboardContent>
      </DHCDashboard>
    </div>
  );
}
```

This approach mirrors `UITable`'s pattern:

- Uses `usePersistentState` with a versioned type for dehydrated state
- Keeps `initialDehydratedConfig` in a ref to avoid re-hydration on re-renders
- Memoizes the dehydration function for performance
- Dehydrates on layout change, hydrates only on initial mount
- Works recursively for deeply nested dashboards (each level stores its layout in its parent panel's state)

### Phase 4: Serialization & Rehydration

_Note: Phase 3 (Event Handling) was removed as GoldenLayout instances are naturally isolated and resize handling is managed automatically by GoldenLayout._

#### 4.1 Layout State Persistence

Nested dashboard layout state is persisted using `usePersistentState` from `@deephaven/plugin`. The implementation:

1. **Storage**: Uses `usePersistentState` with key `'NestedDashboardLayout'` to store/retrieve the dehydrated layout config
2. **Initial State**: Stores the initial config in a ref to avoid re-hydration on config changes
3. **Dehydration**: Uses `LayoutUtils.dehydrateLayoutConfig` to convert the GoldenLayout config to a serializable format when layout changes
4. **Debouncing**: Uses `useDebouncedCallback` to avoid flooding with layout change saves
5. **Event Listening**: Listens to GoldenLayout `'stateChanged'` events via `onLayoutConfigChange` callback

```tsx
// Key implementation in NestedDashboard.tsx
const [savedLayoutConfig, setSavedLayoutConfig] = usePersistentState<
  DashboardLayoutConfig | undefined
>(undefined, { type: 'NestedDashboardLayout', version: 1 });

const initialLayoutConfig = useRef(savedLayoutConfig);

// Pass to DHCDashboard
<DHCDashboard
  layoutConfig={initialLayoutConfig.current}
  onLayoutConfigChange={setSavedLayoutConfig}
  onLayoutInitialized={handleLayoutInitialized}
>
```

### Phase 5: Documentation Updates

Update documentation to reflect new capabilities:

```python
# Nested dashboard example
@ui.component
def nested_dashboard_example():
    return ui.panel(
        ui.dashboard(
            ui.row(
                ui.panel("A", title="A"),
                ui.panel("B", title="B"),
            )
        ),
        title="Nested Dashboard",
    )


my_widget = nested_dashboard_example()
```

## Implementation Tasks

### Task 0: Write Tests First

- [ ] Create E2E test file `tests/ui_nested_dashboard.spec.ts`
- [ ] Create Python test fixtures in `tests/app.d/ui_nested_dashboard.py`
- [ ] Add unit tests to `Dashboard.test.tsx`
- [ ] Add unit tests to `NestedDashboard.test.tsx`
- [ ] Add unit tests for nested panel scenarios to `ReactPanel.test.tsx`

### Task 1: Core Components

- [x] Create `NestedDashboard` component with `DHCDashboard`, `PortalPanelManager`, and context providers
- [x] Modify `Dashboard` to detect nesting and delegate to `NestedDashboard`
- [x] Reset `ReactPanelContext` in nested dashboards (done in `NestedDashboardContent`)
- [x] Add resize handling for nested layouts (handled automatically by GoldenLayout)

### Task 2: State Management

- [x] Ensure `PortalPanelManager` works correctly for nested dashboards
- [x] Use `LayoutUtils.dehydrateLayoutConfig` for layout dehydration
- [x] Use `usePersistentState` with dehydration pattern in `NestedDashboard`
- [x] Listen to `stateChanged` events via `onGoldenLayoutChange` for persistence

### Task 3: Run Tests & Iterate

- [x] Run E2E tests and fix failures
- [x] Run unit tests and fix failures
- [ ] Add additional test cases as edge cases are discovered

### Task 4: Documentation

- [ ] Update [dashboard.md](../plugins/ui/docs/components/dashboard.md) component docs
- [ ] Update [creating-dashboards.md](../plugins/ui/docs/creating-layouts/creating-dashboards.md) guide
- [ ] Add examples for nested dashboard use cases
- [ ] Update [DESIGN.md](../plugins/ui/DESIGN.md) architecture section

## Open Questions

1. **Cross-dashboard drag-and-drop**: Should panels be draggable between the nested dashboard and its parent? Initial implementation should disable this - panels stay within their dashboard.

2. **Depth limit**: ~~Should there be a maximum nesting depth?~~ No depth limit - dashboards can be nested arbitrarily deep (dashboard in panel in dashboard in panel, etc.). Each nested dashboard creates its own isolated GoldenLayout instance.

3. **Size constraints**: How should nested dashboards behave when their container panel is very small? GoldenLayout has minimum size constraints that may need tuning.

4. **Widget lifecycle**: When a parent panel closes, the nested dashboard's GoldenLayout is destroyed via React cleanup. Verify this works correctly.

## Risks and Mitigations

| Risk                                             | Mitigation                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Performance with multiple GoldenLayout instances | Test with realistic workloads; document performance considerations for deep nesting |
| Event handling conflicts                         | GoldenLayout instances are naturally isolated; verify with tests                    |
| State management complexity                      | Each dashboard manages its own state; nested state stored in parent widget data     |
| User confusion                                   | Clear visual distinction between dashboard levels; document limitations             |

## Success Criteria

1. Users can create dashboards inside panels without errors
2. Nested dashboards support drag-and-drop panel rearrangement
3. State is properly persisted and rehydrated across page loads
4. No performance regression for non-nested dashboards
5. Documentation clearly explains nested dashboard capabilities and limitations
6. All E2E and unit tests pass

## Timeline Estimate

| Phase                                     | Estimated Duration |
| ----------------------------------------- | ------------------ |
| Phase 0: Write Tests First                | 1 week             |
| Phase 1: Core Infrastructure              | 1.5 weeks          |
| Phase 2: State Management (including 2.2) | 1 week             |
| Phase 4: Serialization & Rehydration      | 0.5 week           |
| Phase 5: Documentation                    | 0.5 week           |
| Test Iteration & Bug Fixes                | 1.5 weeks          |
| **Total**                                 | **6 weeks**        |

_Note: Phase 3 (Event Handling) was removed as GoldenLayout provides natural event isolation._

## References

- [GoldenLayout Documentation](http://golden-layout.com/docs/)
- [Deephaven Dashboard Package](https://github.com/deephaven/web-client-ui/tree/main/packages/dashboard)
- [Current Dashboard Documentation](../plugins/ui/docs/components/dashboard.md)
- [UI Plugin DESIGN.md](../plugins/ui/DESIGN.md)
