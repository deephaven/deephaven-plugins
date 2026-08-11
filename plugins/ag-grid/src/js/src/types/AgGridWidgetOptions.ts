import type { ColDef } from 'ag-grid-community';

/**
 * Options sent from the server in the AgGrid widget payload.
 */
export type AgGridWidgetOptions = {
  /**
   * Map from column name to a partial column definition. These properties are merged on top of the
   * column definitions generated from the table schema.
   */
  columnDefs?: Record<string, Partial<ColDef>>;
};

export default AgGridWidgetOptions;
