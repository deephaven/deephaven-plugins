import React from 'react';
import styles from '@ag-grid-community/styles/ag-grid.css?inline'; // Core CSS
import quartzStyles from '@ag-grid-community/styles/ag-theme-quartz.css?inline'; // Theme
import type { dh as DhType } from '@deephaven/jsapi-types';
import AgGridServerSideView from './AgGridServerSideView';
import AgGridViewportView from './AgGridViewportView';
import { WorkspaceSettings } from '@deephaven/redux';

type AgGridViewProps = {
  table: DhType.Table;

  settings?: WorkspaceSettings;

  /** Choose which model to use */
  rowModelType?: 'viewport' | 'serverSide';
};

/**
 * Basic AgGrid view that uses a Deephaven table a data source and displays it in AG Grid.
 *
 * Does not support value formatting, sorting, filtering, or basically any functionality beyond
 * just displaying the columns and rows of data.
 */
export function AgGridView({
  table,
  settings,
  rowModelType = 'serverSide',
}: AgGridViewProps): JSX.Element | null {
  return (
    <div className="deephaven-ag-grid-view ag-theme-quartz-dark h-100">
      <style>{styles}</style>
      <style>{quartzStyles}</style>
      {rowModelType === 'serverSide' ? (
        <AgGridServerSideView table={table} settings={settings} />
      ) : (
        <AgGridViewportView table={table} />
      )}
    </div>
  );
}

export default AgGridView;
