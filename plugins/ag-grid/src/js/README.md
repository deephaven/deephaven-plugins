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

The `DeephavenViewportDatasource` class is designed to work with AG Grid's viewport row model. It fetches data from a Deephaven table and provides it to the grid as needed. The datasource handles the logic for fetching rows based on the current viewport, which is defined by the first and last row indices.

The [`DeephavenViewportDatasource` listens to the grid's events](./src/datasources/DeephavenViewportDatasource.ts#115) to determine when to update the filters, sorts, aggregations, and groupings in the Deephaven table. Functions in the [utils](./src/utils/) map the Grid's state to operations that can be applied to the Deephaven Table object, which then applies the operation on the server side.

- [AgGridFilterUtils](./src/utils/AgGridFilterUtils.ts): Utility functions for mapping AG Grid filter models to Deephaven table operations.
- [AgGridSortUtils](./src/utils/AgGridSortUtils.ts): Utility functions for mapping AG Grid sort models to Deephaven table operations.
- [AgGridAggUtils](./src/utils/AgGridAggUtils.ts): Utility functions for mapping AG Grid aggregation and grouping models to Deephaven table operations.
- [AgGridPivotUtils](./src/utils/AgGridPivotUtils.ts): Utility functions for handling pivot tables in AG Grid with Deephaven.
- [AgGridFormatter](./src/utils/AgGridFormatter.ts): AG Grid formatter that takes Deephaven workspace settings to format columns.
