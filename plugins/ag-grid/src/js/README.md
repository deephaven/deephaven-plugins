# Deephaven JS Plugin for AG Grid

This package can be used to display Deephaven tables using [AG Grid](https://www.ag-grid.com/). It is currently in a beta state.

## Usage

Import the DeephavenViewportDatasource and use it with your AG Grid view. For example, in React:

```tsx
import React, { useEffect, useRef } from 'react';
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
      // other AG Grid properties
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
