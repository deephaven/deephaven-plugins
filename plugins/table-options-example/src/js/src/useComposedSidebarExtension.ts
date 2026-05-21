import { useContext, useMemo } from 'react';
import {
  IrisGridSidebarContext,
  type IrisGridSidebarExtension,
  type OptionItem,
  OptionType,
} from '@deephaven/iris-grid';
import { ColumnInspectorPage } from './ColumnInspectorPage';
import { COLUMN_INSPECTOR_ITEM_TYPE } from './columnInspectorItemType';

const COLUMN_INSPECTOR_ITEM: OptionItem = {
  type: COLUMN_INSPECTOR_ITEM_TYPE,
  title: 'Column Inspector',
  subtitle: 'Plugin-contributed sidebar page',
  configPage: ColumnInspectorPage,
};

/**
 * Composes this plugin's contribution on top of any parent
 * `IrisGridSidebarContext` value already present in the tree:
 *
 *   parent.transformTableOptions → drop SELECT_DISTINCT → append COLUMN_INSPECTOR_ITEM
 *
 * Returning a memoized value keeps `IrisGrid`'s transform input
 * referentially stable between renders.
 */
export function useComposedSidebarExtension(): IrisGridSidebarExtension {
  const parent = useContext(IrisGridSidebarContext);
  return useMemo<IrisGridSidebarExtension>(() => {
    const parentTransform = parent?.transformTableOptions;
    return {
      transformTableOptions: defaults => {
        const base =
          parentTransform != null ? parentTransform(defaults) : defaults;
        const filtered = base.filter(
          o => o.type !== OptionType.SELECT_DISTINCT
        );
        return [...filtered, COLUMN_INSPECTOR_ITEM];
      },
    };
  }, [parent]);
}

export default useComposedSidebarExtension;
