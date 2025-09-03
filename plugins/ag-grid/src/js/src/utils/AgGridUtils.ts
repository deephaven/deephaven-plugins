import { AgGridReactProps } from '@ag-grid-community/react';
import { ViewportRowModelModule } from '@ag-grid-enterprise/viewport-row-model';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';

// eslint-disable-next-line import/prefer-default-export
export function getDefaultProps(): AgGridReactProps {
  return {
    modules: [
      RowGroupingModule,
      ViewportRowModelModule,
      ColumnsToolPanelModule,
      ServerSideRowModelModule,
    ],
    defaultColDef: {
      filterParams: {
        buttons: ['reset', 'apply'],
      },
    },
    rowSelection: {
      mode: 'multiRow',
      checkboxes: false,
      headerCheckbox: false,
      enableClickSelection: true,
    },
    suppressCellFocus: true,
    rowStyle: {
      // Displays numbers as monospace figures. Keeps decimal alignment.
      fontVariantNumeric: 'tabular-nums',
    },
    // Set this to true, otherwise AG Grid will try and re-sort columns when we expand/collapse pivots
    enableStrictPivotColumnOrder: true,
    // We use a different separator because the default `_` is used often in column names.
    // `/` is not a valid Java identifier so is good as a separator.
    serverSidePivotResultFieldSeparator: '/',
    suppressAggFuncInHeader: true,
  };
}
