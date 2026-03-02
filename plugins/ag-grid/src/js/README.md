# Deephaven JS Plugin for AG Grid

This package can be used to display Deephaven tables using [AG Grid](https://www.ag-grid.com/). It is currently in a beta state.

## Usage

The easiest way to use this plugin is to import and use the provided `AgGridView` component directly. You must wrap it with an `ApiContext.Provider` to provide the Deephaven API instance:

```tsx
import React from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';
// Only if using Core+ features
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { AgGridView } from '@deephaven/js-plugin-ag-grid';
import { ApiContext } from '@deephaven/jsapi-bootstrap';

function DeephavenAgGridComponent({
  api,
  table,
}: {
  api: typeof DhType;
  table: DhType.Table | DhType.TreeTable | CorePlusDhType.PivotTable;
}) {
  return (
    <ApiContext.Provider value={api}>
      <AgGridView table={table} />
    </ApiContext.Provider>
  );
}
```

### Formatting

You can pass in custom `Settings` to the `AgGridView` component to configure the grid's formatting. For example, to apply the Singapore time zone, display time down to the nanosecond, and show decimals to 4 places by default:

```tsx
import React, { useMemo } from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { AgGridView } from '@deephaven/js-plugin-ag-grid';
import { ApiContext } from '@deephaven/jsapi-bootstrap';

function FormattedAgGridComponent({
  api,
  table,
}: {
  api: typeof DhType;
  table: DhType.Table | DhType.TreeTable;
}) {
  const settings = useMemo(
    () => ({
      timeZone: 'Singapore',
      defaultDateTimeFormat: 'yyyy-MM-dd HH:mm:ss.SSSSSSSSS',
      defaultDecimalFormatOptions: {
        defaultFormatString: '###,##0.0000',
      },
    }),
    []
  );

  return (
    <ApiContext.Provider value={api}>
      <AgGridView table={table} settings={settings} />
    </ApiContext.Provider>
  );
}
```

## Advanced Usage

You can import the datasource directly if you want to manipulate the `AgGridReact` component directly. Import the DeephavenViewportDatasource and use it with your AG Grid view:

```tsx
import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { DeephavenViewportDatasource } from '@deephaven/js-plugin-ag-grid';

function DeephavenAgGridComponent({
  dh,
  table,
}: {
  dh: typeof DhType;
  table: DhType.Table;
}) {
  const datasource = useMemo(
    () => new DeephavenViewportDatasource(dh, table),
    [dh, table]
  );
  return (
    <AgGridReact
      onGridReady={({ api }) => {
        // Set the API in the Grid when the grid is ready
        datasource.setGridApi(api);
      }}
      rowModelType="viewport"
      viewportDatasource={datasource}
      // ...other AG Grid properties
    />
  );
}
```

## Details

The `DeephavenViewportDatasource` class is designed to work with AG Grid's [Viewport Row Model](https://www.ag-grid.com/react-data-grid/viewport/). It fetches data from a Deephaven table and provides it to the grid as needed. The datasource handles the logic for fetching rows based on the current viewport, which is defined by the first and last row indices.

### Why Viewport Row Model?

We use the Viewport Row Model for efficiency, to only fetch and subscribe to the viewport that's currently visible. This model is ideal for Deephaven's use case because:

- **Efficient viewport-only subscriptions**: With the Viewport Row Model, we can subscribe to only the rows that are currently visible in the grid. This is crucial for Deephaven, as we often work with large datasets that are actively ticking and updating.
- **Avoids unnecessary fetching**: AG Grid's Server-Side Row Model fetches rows outside of the viewport unnecessarily (for Deephaven's purposes) and does not allow Deephaven to subscribe only to the visible viewport for updates. This would waste bandwidth and resources for data that isn't being displayed.
- **Optimized for real-time data**: Since Deephaven tables can have millions of rows with frequent updates, the Viewport Row Model ensures we only process and stream the data that matters to the user at any given moment.

### GridApi Integration

The `DeephavenViewportDatasource` requires the AG Grid `GridApi` to be passed in via the `setGridApi` method. This is necessary because we need to listen to events from the grid that are not provided through the `IViewportDatasource` interface, such as:

- Adding row aggregations (`columnRowGroupChanged`, `columnValueChanged`)
- Applying filters (`filterChanged`)
- Changing sorts (`sortChanged`)
- Expanding/collapsing row groups (`columnGroupOpened`)

Once the `GridApi` is set, the datasource calls `updateGridState` to apply any operations that the user has already configured in the AG Grid UI to the underlying Deephaven table using the JS API. The [`DeephavenViewportDatasource` listens to the grid's events](./src/datasources/DeephavenViewportDatasource.ts#115) and synchronizes them with the Deephaven table. Functions in the [utils](./src/utils/) map the Grid's state to operations that can be applied to the Deephaven Table object, which then applies the operation on the server side.

- [AgGridFilterUtils](./src/utils/AgGridFilterUtils.ts): Utility functions for mapping AG Grid filter models to Deephaven table operations.
- [AgGridSortUtils](./src/utils/AgGridSortUtils.ts): Utility functions for mapping AG Grid sort models to Deephaven table operations.
- [AgGridAggUtils](./src/utils/AgGridAggUtils.ts): Utility functions for mapping AG Grid aggregation and grouping models to Deephaven table operations.
- [AgGridPivotUtils](./src/utils/AgGridPivotUtils.ts): Utility functions for handling pivot tables in AG Grid with Deephaven.
- [AgGridFormatter](./src/utils/AgGridFormatter.ts): AG Grid formatter that takes Deephaven workspace settings to format columns.
