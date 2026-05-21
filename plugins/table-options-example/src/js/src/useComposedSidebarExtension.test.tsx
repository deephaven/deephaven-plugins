import {
  IrisGridTableOptionsContext,
  type IrisGridTableOptionsExtension,
  type OptionItem,
  OptionType,
} from '@deephaven/iris-grid';
import { renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { useComposedTableOptionsExtension } from './useComposedSidebarExtension';
import { COLUMN_INSPECTOR_ITEM_TYPE } from './columnInspectorItemType';

function makeDefaults(): readonly OptionItem[] {
  return Object.freeze([
    { type: OptionType.QUICK_FILTERS, title: 'Quick Filters' },
    { type: OptionType.SELECT_DISTINCT, title: 'Select Distinct Values' },
    { type: OptionType.AGGREGATIONS, title: 'Aggregate Columns' },
  ]);
}

function wrap(parent?: IrisGridTableOptionsExtension | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <IrisGridTableOptionsContext.Provider value={parent ?? null}>
        {children}
      </IrisGridTableOptionsContext.Provider>
    );
  };
}

describe('useComposedTableOptionsExtension', () => {
  it('hides SELECT_DISTINCT and appends the column inspector item when no parent is present', () => {
    const { result } = renderHook(() => useComposedTableOptionsExtension(), {
      wrapper: wrap(null),
    });
    const out = result.current.transformTableOptions!(makeDefaults());

    expect(out.map(o => o.type)).toEqual([
      OptionType.QUICK_FILTERS,
      OptionType.AGGREGATIONS,
      COLUMN_INSPECTOR_ITEM_TYPE,
    ]);
    const item = out.find(o => o.type === COLUMN_INSPECTOR_ITEM_TYPE)!;
    expect(item.title).toBe('Column Inspector');
    expect(item.configPage).toBeDefined();
  });

  it('composes on top of a parent transform (parent runs first)', () => {
    const parentTransform = jest.fn(
      (defaults: readonly OptionItem[]) =>
        defaults.filter(
          o => o.type !== OptionType.QUICK_FILTERS
        ) as readonly OptionItem[]
    );
    const { result } = renderHook(() => useComposedTableOptionsExtension(), {
      wrapper: wrap({ transformTableOptions: parentTransform }),
    });
    const out = result.current.transformTableOptions!(makeDefaults());

    expect(parentTransform).toHaveBeenCalledTimes(1);
    expect(out.map(o => o.type)).toEqual([
      OptionType.AGGREGATIONS,
      COLUMN_INSPECTOR_ITEM_TYPE,
    ]);
  });

  it('returns a stable transform across renders when parent is unchanged', () => {
    const parent = {
      transformTableOptions: (defaults: readonly OptionItem[]) => defaults,
    };
    const { result, rerender } = renderHook(
      () => useComposedTableOptionsExtension(),
      { wrapper: wrap(parent) }
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
