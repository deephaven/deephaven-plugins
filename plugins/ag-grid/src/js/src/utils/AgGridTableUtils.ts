import type { dh as DhType } from '@deephaven/jsapi-types';
import { ColDef } from '@ag-grid-community/core';
import { TableUtils } from '@deephaven/jsapi-utils';

export default class AgGridTableUtils {
  /**
   * Converts a Deephaven column to an AG Grid ColDef with appropriate properties.
   *
   * @param column Deephaven column to map
   * @param templateColDef Template ColDef to use as a base
   * @returns The equivalent AG Grid ColDef
   */
  static convertColumnToColDef(
    column: DhType.Column,
    templateColDef?: Partial<ColDef>
  ): ColDef {
    const dataType = TableUtils.getNormalizedType(column.type);

    switch (dataType) {
      case TableUtils.dataType.BOOLEAN:
        return {
          ...templateColDef,
          cellDataType: dataType,
          filter: true,
          // Disable checkmarks: https://github.com/ag-grid/ag-grid/issues/9315
          cellRenderer: null,
        };
      case TableUtils.dataType.CHAR:
        return {
          ...templateColDef,
          cellDataType: dataType,
          filter: 'agNumberColumnFilter',
          filterParams: {
            allowedCharPattern: 'a-zA-Z',
            buttons: ['reset', 'apply'],
            numberParser: (text: string | null) =>
              text != null && text.length === 1 ? text.charCodeAt(0) : null,
            numberFormatter: (value: number | null) =>
              value != null ? String.fromCharCode(value) : null,
          },
        };
      case TableUtils.dataType.DATETIME:
        return {
          ...templateColDef,
          cellDataType: dataType,
          filter: 'agDateColumnFilter',
        };
      case TableUtils.dataType.DECIMAL:
        return {
          ...templateColDef,
          cellDataType: dataType,
          filter: 'agNumberColumnFilter',
        };
      case TableUtils.dataType.INT:
        return {
          ...templateColDef,
          cellDataType: dataType,
          filter: 'agNumberColumnFilter',
        };
      case TableUtils.dataType.STRING:
        return {
          ...templateColDef,
          cellDataType: dataType,
          filter: true,
        };
      case TableUtils.dataType.UNKNOWN:
        return {
          ...templateColDef,
          cellDataType: dataType,
          filter: false,
        };
    }
  }
}
