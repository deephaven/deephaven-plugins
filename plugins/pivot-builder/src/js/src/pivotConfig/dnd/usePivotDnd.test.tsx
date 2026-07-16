import { act, renderHook } from '@testing-library/react';
import {
  AggregationUtils,
  DndKitCore,
  type AggregationSettings,
} from '@deephaven/iris-grid';
import usePivotDnd, {
  type UsePivotDndParams,
  type UsePivotDndResult,
} from './usePivotDnd';
import {
  AGGREGATIONS_DROPPABLE,
  PIVOT_COLUMNS_DROPPABLE,
  ROLLUP_ROWS_DROPPABLE,
  aggregationColumnId,
  aggregationRowId,
  columnItemId,
} from './dndIds';

interface AggInput {
  operation: string;
  selected: string[];
}

function makeAggSettings(aggs: AggInput[]): AggregationSettings {
  return {
    aggregations: aggs.map(a => ({
      operation:
        a.operation as AggregationSettings['aggregations'][number]['operation'],
      selected: a.selected,
      invert: false,
    })),
    showOnTop: false,
  };
}

function makeParams(
  overrides: Partial<UsePivotDndParams> = {}
): UsePivotDndParams {
  return {
    rollupRows: [],
    pivotColumns: [],
    aggregationSettings: makeAggSettings([]),
    columnTypes: {},
    onRollupRowsChange: jest.fn(),
    onPivotColumnsChange: jest.fn(),
    onAggregationSettingsChange: jest.fn(),
    ...overrides,
  };
}

function startEvent(id: string, container: string): DndKitCore.DragStartEvent {
  return {
    active: { id, data: { current: { container } } },
  } as unknown as DndKitCore.DragStartEvent;
}

function overEvent(
  activeId: string,
  overId: string,
  opts: {
    translatedTop?: number;
    overRect?: { top: number; height: number };
  } = {}
): DndKitCore.DragOverEvent {
  return {
    active: {
      id: activeId,
      rect: {
        current: {
          translated:
            opts.translatedTop == null ? null : { top: opts.translatedTop },
        },
      },
    },
    over: { id: overId, rect: opts.overRect ?? { top: 0, height: 0 } },
  } as unknown as DndKitCore.DragOverEvent;
}

function endEvent(
  activeId: string,
  overId: string | null
): DndKitCore.DragEndEvent {
  return {
    active: { id: activeId },
    over: overId == null ? null : { id: overId },
  } as unknown as DndKitCore.DragEndEvent;
}

type HookResult = { current: UsePivotDndResult };

function dragStart(result: HookResult, id: string, container: string): void {
  act(() => {
    result.current.handleDragStart(startEvent(id, container));
  });
}

function dragOver(result: HookResult, activeId: string, overId: string): void {
  act(() => {
    result.current.handleDragOver(overEvent(activeId, overId));
  });
}

function dragEnd(
  result: HookResult,
  activeId: string,
  overId: string | null
): void {
  act(() => {
    result.current.handleDragEnd(endEvent(activeId, overId));
  });
}

function dragCancel(result: HookResult): void {
  act(() => {
    result.current.handleDragCancel();
  });
}

describe('usePivotDnd', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('derives idle values from the committed props', () => {
    const { result } = renderHook(() =>
      usePivotDnd(
        makeParams({
          rollupRows: ['A', 'B'],
          pivotColumns: ['C'],
          aggregationSettings: makeAggSettings([
            { operation: 'Sum', selected: ['price'] },
          ]),
        })
      )
    );

    expect(result.current.dragSource).toBeNull();
    expect(result.current.rollupColumnIds).toEqual([
      columnItemId('A'),
      columnItemId('B'),
    ]);
    expect(result.current.pivotColumnIds).toEqual([columnItemId('C')]);
    expect(result.current.aggItemIds).toEqual([aggregationRowId('Sum')]);
    expect(result.current.aggColumnGroups).toEqual([
      {
        operation: 'Sum',
        columnItems: [
          { id: aggregationColumnId('Sum', 'price'), column: 'price' },
        ],
      },
    ]);
    expect(result.current.dropInvalid).toBe(false);
    expect(result.current.isDraggingAggregationGroup).toBe(false);
    expect(result.current.dragOverlayPreview).toBeNull();
    expect(result.current.measuring.droppable.strategy).toBe(
      DndKitCore.MeasuringStrategy.WhileDragging
    );
  });

  it('starts a column drag: sets source, overlay, and continuous measuring', () => {
    const { result } = renderHook(() =>
      usePivotDnd(makeParams({ rollupRows: ['A'], pivotColumns: ['B'] }))
    );

    dragStart(result, columnItemId('A'), ROLLUP_ROWS_DROPPABLE);

    expect(result.current.dragSource).toBe(ROLLUP_ROWS_DROPPABLE);
    expect(result.current.measuring.droppable.strategy).toBe(
      DndKitCore.MeasuringStrategy.Always
    );
    expect(result.current.dragOverlayPreview).not.toBeNull();
  });

  it('commits a within-card column reorder on drop', () => {
    const onRollupRowsChange = jest.fn();
    const { result } = renderHook(() =>
      usePivotDnd(
        makeParams({ rollupRows: ['A', 'B', 'C'], onRollupRowsChange })
      )
    );

    dragStart(result, columnItemId('C'), ROLLUP_ROWS_DROPPABLE);
    dragEnd(result, columnItemId('C'), columnItemId('A'));

    expect(onRollupRowsChange).toHaveBeenCalledWith(['C', 'A', 'B']);
  });

  it('moves a column across cards in the preview and commits both lists on drop', () => {
    const onRollupRowsChange = jest.fn();
    const onPivotColumnsChange = jest.fn();
    const { result } = renderHook(() =>
      usePivotDnd(
        makeParams({
          rollupRows: ['A'],
          pivotColumns: ['B'],
          onRollupRowsChange,
          onPivotColumnsChange,
        })
      )
    );

    dragStart(result, columnItemId('A'), ROLLUP_ROWS_DROPPABLE);
    dragOver(result, columnItemId('A'), PIVOT_COLUMNS_DROPPABLE);

    // Live preview reflects the cross-card hop before any state is committed.
    expect(result.current.rollupColumnIds).toEqual([]);
    expect(result.current.pivotColumnIds).toEqual([
      columnItemId('B'),
      columnItemId('A'),
    ]);

    dragEnd(result, columnItemId('A'), PIVOT_COLUMNS_DROPPABLE);

    expect(onRollupRowsChange).toHaveBeenCalledWith([]);
    expect(onPivotColumnsChange).toHaveBeenCalledWith(['B', 'A']);
  });

  it('reorders whole aggregate-function rows on drop', () => {
    const onAggregationSettingsChange = jest.fn();
    const { result } = renderHook(() =>
      usePivotDnd(
        makeParams({
          aggregationSettings: makeAggSettings([
            { operation: 'Sum', selected: ['price'] },
            { operation: 'Avg', selected: ['qty'] },
          ]),
          onAggregationSettingsChange,
        })
      )
    );

    // No column/agg-column preview was seeded, so this takes the whole-row
    // reorder path.
    dragEnd(result, aggregationRowId('Avg'), aggregationRowId('Sum'));

    expect(onAggregationSettingsChange).toHaveBeenCalledTimes(1);
    const next = onAggregationSettingsChange.mock
      .calls[0][0] as AggregationSettings;
    expect(next.aggregations.map(a => a.operation)).toEqual(['Avg', 'Sum']);
  });

  it('flags an invalid aggregate-column drop without moving it', () => {
    const isValidSpy = jest
      .spyOn(AggregationUtils, 'isValidOperation')
      .mockReturnValue(false);
    const activeId = aggregationColumnId('Sum', 'price');
    const { result } = renderHook(() =>
      usePivotDnd(
        makeParams({
          aggregationSettings: makeAggSettings([
            { operation: 'Sum', selected: ['price'] },
            { operation: 'First', selected: [] },
          ]),
          columnTypes: { price: 'double' },
        })
      )
    );

    dragStart(result, activeId, AGGREGATIONS_DROPPABLE);
    dragOver(result, activeId, aggregationRowId('First'));

    expect(isValidSpy).toHaveBeenCalled();
    expect(result.current.dropInvalid).toBe(true);
    // The column stays in its source group; nothing hopped into First.
    expect(result.current.aggColumnGroups).toEqual([
      { operation: 'Sum', columnItems: [{ id: activeId, column: 'price' }] },
      { operation: 'First', columnItems: [] },
    ]);
  });

  it('moves an aggregate column into a valid group and commits merged settings', () => {
    const onAggregationSettingsChange = jest.fn();
    jest.spyOn(AggregationUtils, 'isValidOperation').mockReturnValue(true);
    const activeId = aggregationColumnId('Sum', 'price');
    const { result } = renderHook(() =>
      usePivotDnd(
        makeParams({
          aggregationSettings: makeAggSettings([
            { operation: 'Sum', selected: ['price'] },
            { operation: 'First', selected: ['sym'] },
          ]),
          columnTypes: { price: 'double' },
          onAggregationSettingsChange,
        })
      )
    );

    dragStart(result, activeId, AGGREGATIONS_DROPPABLE);
    dragOver(result, activeId, aggregationRowId('First'));
    dragEnd(result, activeId, aggregationRowId('First'));

    expect(onAggregationSettingsChange).toHaveBeenCalledTimes(1);
    const next = onAggregationSettingsChange.mock
      .calls[0][0] as AggregationSettings;
    expect(next.aggregations.map(a => [a.operation, a.selected])).toEqual([
      ['First', ['sym', 'price']],
    ]);
  });

  it('resets drag state on cancel without committing', () => {
    const onRollupRowsChange = jest.fn();
    const onPivotColumnsChange = jest.fn();
    const { result } = renderHook(() =>
      usePivotDnd(
        makeParams({
          rollupRows: ['A'],
          pivotColumns: ['B'],
          onRollupRowsChange,
          onPivotColumnsChange,
        })
      )
    );

    dragStart(result, columnItemId('A'), ROLLUP_ROWS_DROPPABLE);
    expect(result.current.dragSource).toBe(ROLLUP_ROWS_DROPPABLE);

    dragCancel(result);

    expect(result.current.dragSource).toBeNull();
    expect(result.current.dragOverlayPreview).toBeNull();
    expect(result.current.measuring.droppable.strategy).toBe(
      DndKitCore.MeasuringStrategy.WhileDragging
    );
    expect(onRollupRowsChange).not.toHaveBeenCalled();
    expect(onPivotColumnsChange).not.toHaveBeenCalled();
  });
});
