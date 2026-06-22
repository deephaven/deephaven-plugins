import { dhPivotTable } from '@deephaven/icons';
import {
  type OptionItem,
  type TableOptionsTransform,
} from '@deephaven/iris-grid';
import { CreatePivotPage } from './CreatePivotPage';
import { CREATE_PIVOT_ITEM_TYPE } from './createPivotItemType';

/**
 * Built-in Table Options items superseded by the unified Create Pivot
 * page. Matched on the `OptionType` enum's string values (`ROLLUP_ROWS`,
 * `AGGREGATIONS`) so this works without a runtime dependency on the
 * `OptionType` enum from the installed `@deephaven/iris-grid`.
 */
const HIDDEN_BUILT_IN_TYPES: ReadonlySet<string> = new Set([
  'ROLLUP_ROWS',
  'AGGREGATIONS',
]);

/**
 * Builds a pure `transformTableOptions` that runs the upstream transform
 * (if any) first so contributions compose, hides the built-in Rollup Rows
 * and Aggregations items (superseded by the unified Create Pivot page),
 * then appends the unified Pivot item. Its `order` (650) positions it
 * between the built-in Aggregate Columns (600) and Select Distinct Values
 * (700) entries.
 */
export function makeCreatePivotTransform(
  upstream: TableOptionsTransform | undefined
): TableOptionsTransform {
  return defaults => {
    const base = upstream != null ? upstream(defaults) : defaults;
    const filtered = base.filter(
      option => !HIDDEN_BUILT_IN_TYPES.has(String(option.type))
    );
    const item: OptionItem = {
      type: CREATE_PIVOT_ITEM_TYPE,
      title: 'Rollup, Aggregate and Pivot',
      icon: dhPivotTable,
      order: 650,
      configPage: CreatePivotPage,
    };
    return [...filtered, item];
  };
}

export default makeCreatePivotTransform;
