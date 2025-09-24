# Deephaven JS Plugin for Pivot Tables

This package adds support for Pivot tables in Iris Grid in Core+.

## Usage
The easiest way to use this plugin is to import and use the provided `IrisGridPivotView` component directly. You must wrap it with an `ApiContext.Provider` to provide the Deephaven API instance:

```tsx
import { type dh } from '@deephaven/jsapi-types';
import { WidgetPanelProps } from '@deephaven/plugin';
import { IrisGridPanel } from '@deephaven/dashboard-core-plugins';
import useHydratePivotGrid from './useHydratePivotGrid';

function PivotPanel(props: WidgetPanelProps<dh.Widget>): JSX.Element {
  const { localDashboardId, fetch, metadata } = props;

  // Provides makeModel, custom renderer, theme, and other props needed to render a Pivot in IrisGridPanel
  const hydratedProps = useHydratePivotGrid(fetch, localDashboardId, metadata);

  return (
    <IrisGridPanel
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...hydratedProps}
    />
  );
}
```

