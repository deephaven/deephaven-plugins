import { dhPivotTable } from '@deephaven/icons';
import { CreatePivotPage } from './CreatePivotPage';
import { CREATE_PIVOT_ITEM_TYPE } from './createPivotItemType';
import {
  type OptionItem,
  type TableOptionsTransform,
} from './tableOptionsTypes';

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
 * then appends the Create/Edit Pivot item. Its `order` (650) positions it
 * between the built-in Aggregate Columns (600) and Select Distinct Values
 * (700) entries.
 *
 * `isPivot` is a snapshot of model state (derived in the middleware from
 * model events), passed in as a value rather than read from the model
 * inside the transform — this keeps the transform pure and lets
 * `IrisGrid` re-run it only when the snapshot (and thus the transform
 * identity) changes. It drives the item's title so the menu reads "Edit"
 * once a pivot exists and "Create" otherwise.
 */
export function makeCreatePivotTransform(
  upstream: TableOptionsTransform | undefined,
  isPivot: boolean
): TableOptionsTransform {
  return defaults => {
    const base = upstream != null ? upstream(defaults) : defaults;
    const filtered = base.filter(
      option => !HIDDEN_BUILT_IN_TYPES.has(String(option.type))
    );
    const item: OptionItem = {
      type: CREATE_PIVOT_ITEM_TYPE,
      title: isPivot
        ? 'Edit Rollup, Aggregate and Pivot'
        : 'Rollup, Aggregate and Pivot',
      icon: dhPivotTable,
      order: 650,
      configPage: CreatePivotPage,
    };
    return [...filtered, item];
  };
}

export default makeCreatePivotTransform;
