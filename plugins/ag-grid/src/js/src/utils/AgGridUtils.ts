import { AgGridReactProps } from 'ag-grid-react';
import {
  AdvancedFilterModule,
  AllCommunityModule,
  ColumnsToolPanelModule,
  GroupFilterModule,
  PivotModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  ServerSideRowModelModule,
  TreeDataModule,
  ViewportRowModelModule,
} from 'ag-grid-enterprise';

// eslint-disable-next-line import/prefer-default-export
export function getDefaultProps(): AgGridReactProps {
  return {
    modules: [
      AdvancedFilterModule,
      RowGroupingModule,
      RowGroupingPanelModule,
      GroupFilterModule,
      TreeDataModule,
      PivotModule,
      ViewportRowModelModule,
      ColumnsToolPanelModule,
      ServerSideRowModelModule,
      AllCommunityModule,
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
    enableAdvancedFilter: true,
  };
}
