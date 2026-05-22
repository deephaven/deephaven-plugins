import { useContext, useMemo } from 'react';
import {
  IrisGridTableOptionsContext,
  type IrisGridTableOptionsExtension,
  type OptionItem,
} from '@deephaven/iris-grid';
import { CreatePivotPage } from './CreatePivotPage';
import { CREATE_PIVOT_ITEM_TYPE } from './createPivotItemType';

const CREATE_PIVOT_ITEM: OptionItem = {
  type: CREATE_PIVOT_ITEM_TYPE,
  title: 'Create Pivot',
  subtitle: 'Build a pivot from this table',
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
        return [...base, CREATE_PIVOT_ITEM];
      },
    };
  }, [parent]);
}

export default useComposedTableOptionsExtension;
