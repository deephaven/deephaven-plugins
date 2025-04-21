import type { dh as DhType } from '@deephaven/jsapi-types';
import AgGridServerSideView from './AgGridServerSideView';
import AgGridViewportView from './AgGridViewportView';
import { WorkspaceSettings } from '@deephaven/redux';
import { AgGridReactProps } from '@ag-grid-community/react';
import styles from './AgGridCustomStyles.css?inline';

type AgGridViewProps = {
  table: DhType.Table;
  settings?: WorkspaceSettings;
  agGridProps?: AgGridReactProps;
  /** Choose which model to use */
  rowModelType?: 'viewport' | 'serverSide';
};

/**
 * Basic AgGrid view that uses a Deephaven table a data source and displays it in AG Grid.
 *
 * AgGridViewportView currently does not support value formatting, sorting, filtering, or basically any
 * functionality beyond just displaying the columns and rows of data.
 */
export function AgGridView({
  table,
  settings,
  agGridProps,
  rowModelType = 'serverSide',
}: AgGridViewProps): JSX.Element | null {
  return (
    <div className="deephaven-ag-grid-view h-100">
      <style>{styles}</style>
      {rowModelType === 'serverSide' ? (
        <AgGridServerSideView
          table={table}
          settings={settings}
          agGridProps={agGridProps}
        />
      ) : (
        <AgGridViewportView table={table} />
      )}
    </div>
  );
}

export default AgGridView;
