import { Column, ColumnState, GridApi } from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';

export type AggregatedColumn = {
  colId: string;
  aggFunc: string;
};

/**
 * Checks if the given ColumnState item is an aggregated column.
 * @param item ColumnState item to check
 * @returns True if the item is an aggregated column, otherwise false.
 */
export function isAggregatedColumn(
  item: ColumnState
): item is AggregatedColumn {
  return item.aggFunc != null && item.colId != null;
}

export function getAggregatedColumns(gridApi: GridApi): AggregatedColumn[] {
  const columnState = gridApi.getColumnState();
  return columnState.filter(isAggregatedColumn);
}

/**
 * Gets the aggregation operation string for the given AG Grid aggregation function.
 * @param dh Deephaven API instance to use
 * @param agGridAggFunc AG Grid aggregation function to convert
 * @returns The corresponding Deephaven aggregation operation string.
 */
export function getAggregationOperation(
  dh: typeof DhType,
  agGridAggFunc: DhType.AggregationOperationType
): string {
  switch (agGridAggFunc) {
    case 'sum':
      return dh.AggregationOperation.SUM;
    case 'avg':
      return dh.AggregationOperation.AVG;
    case 'min':
      return dh.AggregationOperation.MIN;
    case 'max':
      return dh.AggregationOperation.MAX;
    case 'count':
      return dh.AggregationOperation.COUNT;
    default:
      throw new Error(`Unknown aggregation function: ${agGridAggFunc}`);
  }
}

export function getAggregationOperationMap(
  dh: typeof DhType,
  aggregatedColumns: AggregatedColumn[]
): Record<DhType.AggregationOperationType, string[]> {
  const operationMap: Record<DhType.AggregationOperationType, string[]> = {};
  aggregatedColumns.forEach(aggregatedColumn => {
    const aggOperation = getAggregationOperation(dh, aggregatedColumn.aggFunc);
    if (operationMap[aggOperation] == null) {
      operationMap[aggOperation] = [];
    }
    operationMap[aggOperation].push(aggregatedColumn.colId);
  });
  return operationMap;
}

export function getRollupConfig(
  rowGroupColumns: Column[],
  aggColumns: AggregatedColumn[],
  dh: typeof DhType
): DhType.RollupConfig {
  const rollupConfig: DhType.RollupConfig = new dh.RollupConfig();
  rollupConfig.groupingColumns = rowGroupColumns.map(c => c.getId());
  rollupConfig.includeConstituents = true;
  rollupConfig.aggregations = getAggregationOperationMap(dh, aggColumns);

  return rollupConfig;
}
