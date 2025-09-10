import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';

export type AgGridTableType =
  | DhType.Table
  | DhType.TreeTable
  | CorePlusDhType.coreplus.pivot.PivotTable;

export default AgGridTableType;
