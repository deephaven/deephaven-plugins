import { useContext, useMemo } from 'react';
import {
  IrisGridTableOptionsContext,
  OptionType,
  type IrisGridTableOptionsExtension,
  type OptionItem,
} from '@deephaven/iris-grid';
import { dhPivotTable } from '@deephaven/icons';
import { CreatePivotPage } from './CreatePivotPage';
import { CREATE_PIVOT_ITEM_TYPE } from './createPivotItemType';

const CREATE_PIVOT_ITEM: OptionItem = {
  type: CREATE_PIVOT_ITEM_TYPE,
  title: 'Rollup, Aggregate and Pivot',
  icon: dhPivotTable,
  configPage: CreatePivotPage,
};

/**
 * Composes this plugin's sidebar contribution on top of any parent
 * `IrisGridTableOptionsContext` already in scope. Pattern lifted from
 * `table-options-example/useComposedTableOptionsExtension`.
 */
export function useComposedTableOptionsExtension(): IrisGridTableOptionsExtension {
  const parent = useContext(IrisGridTableOptionsContext);
  return useMemo<IrisGridTableOptionsExtension>(() => {
    const parentTransform = parent?.transformTableOptions;
    return {
      transformTableOptions: defaults => {
        const base =
          parentTransform != null ? parentTransform(defaults) : defaults;
        const aggregationsIndex = base.findIndex(
          item => item.type === OptionType.AGGREGATIONS
        );
        if (aggregationsIndex < 0) {
          return [...base, CREATE_PIVOT_ITEM];
        }
        return [
          ...base.slice(0, aggregationsIndex),
          CREATE_PIVOT_ITEM,
          ...base.slice(aggregationsIndex),
        ];
      },
    };
  }, [parent]);
}

export default useComposedTableOptionsExtension;
