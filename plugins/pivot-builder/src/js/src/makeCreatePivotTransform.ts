import { OptionType } from '@deephaven/iris-grid';
import { dhPivotTable } from '@deephaven/icons';
import { CreatePivotPage } from './CreatePivotPage';
import { CREATE_PIVOT_ITEM_TYPE } from './createPivotItemType';
import {
  type OptionItem,
  type TableOptionsTransform,
} from './tableOptionsTypes';

/**
 * Builds a pure `transformTableOptions` that runs the upstream transform
 * (if any) first so contributions compose, then inserts the Create/Edit
 * Pivot item just before the built-in Aggregate Columns entry.
 *
 * `isPivot` is a snapshot of model state (derived in the middleware from
 * model events), passed in as a value rather than read from the model
 * inside the transform — this keeps the transform pure and lets
 * `IrisGrid` re-run it only when the snapshot (and thus the transform
 * identity) changes.
 */
export function makeCreatePivotTransform(
  upstream: TableOptionsTransform | undefined,
  isPivot: boolean
): TableOptionsTransform {
  return defaults => {
    const base = upstream != null ? upstream(defaults) : defaults;
    const item: OptionItem = {
      type: CREATE_PIVOT_ITEM_TYPE,
      title: 'Rollup, Aggregate and Pivot',
      icon: dhPivotTable,
      configPage: CreatePivotPage,
    };
    const aggregationsIndex = base.findIndex(
      o => o.type === OptionType.AGGREGATIONS
    );
    if (aggregationsIndex < 0) {
      return [...base, item];
    }
    return [
      ...base.slice(0, aggregationsIndex),
      item,
      ...base.slice(aggregationsIndex),
    ];
  };
}

export default makeCreatePivotTransform;
