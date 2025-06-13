import { ColumnState } from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';

export type AggregatedColumn = {
  colId: string;
  aggFunc: string;
};

export function isAggregatedColumn(
  item: ColumnState
): item is AggregatedColumn {
  return item.aggFunc != null && item.colId != null;
}

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
