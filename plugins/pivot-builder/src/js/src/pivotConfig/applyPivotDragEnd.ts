import {
  type AggregationOperation,
  AggregationUtils,
  type AggregationSettings,
} from '@deephaven/iris-grid';
import {
  AGGREGATIONS_DROPPABLE,
  PIVOT_COLUMNS_DROPPABLE,
  ROLLUP_ROWS_DROPPABLE,
  parseAggregationId,
  resolveContainerOfId,
} from './dndIds';
import { moveItem, removeAt } from './arrayUtils';

export interface ApplyPivotDragEndParams {
  activeId: string;
  overId: string;
  aggregationSettings: AggregationSettings;
  rollupRows: string[];
  pivotColumns: string[];
  columnTypes: Readonly<Record<string, string>>;
  onAggregationSettingsChange: (next: AggregationSettings) => void;
  onRollupRowsChange: (next: string[]) => void;
  onPivotColumnsChange: (next: string[]) => void;
}

/**
 * Pure reducer for a drag-and-drop drop in the pivot config section. Given the
 * active/over ids and current card state, computes the next state and applies
 * it via the change callbacks. No-ops when the drop doesn't map to a valid
 * move. Extracted from `PivotConfigSection` so the (gnarly) reconciliation is
 * isolated and independently testable.
 */
export function applyPivotDragEnd({
  activeId,
  overId,
  aggregationSettings,
  rollupRows,
  pivotColumns,
  columnTypes,
  onAggregationSettingsChange,
  onRollupRowsChange,
  onPivotColumnsChange,
}: ApplyPivotDragEndParams): void {
  const fromId = resolveContainerOfId(activeId);
  const toId = resolveContainerOfId(overId);
  if (fromId == null || toId == null) return;

  // Aggregations are a separate scope. Whole-function rows reorder among
  // themselves; an individual column can also be reassigned to another
  // function, provided that function accepts the column's type.
  if (fromId === AGGREGATIONS_DROPPABLE) {
    if (toId !== AGGREGATIONS_DROPPABLE) return;

    const { aggregations } = aggregationSettings;
    const activeParsed = parseAggregationId(activeId);
    if (activeParsed == null) return;
    const overParsed =
      overId === AGGREGATIONS_DROPPABLE ? null : parseAggregationId(overId);

    // Whole-function row drag: reorder the entries. Tolerates an `over`
    // that resolves to a column row by mapping it back to its function.
    if (activeParsed.column == null) {
      const fromIdx = aggregations.findIndex(
        entry => entry.operation === activeParsed.operation
      );
      if (fromIdx < 0) return;
      const toIdx =
        overParsed == null
          ? aggregations.length - 1
          : aggregations.findIndex(
              entry => entry.operation === overParsed.operation
            );
      if (toIdx < 0 || fromIdx === toIdx) return;
      onAggregationSettingsChange({
        ...aggregationSettings,
        aggregations: moveItem(aggregations, fromIdx, toIdx),
      });
      return;
    }

    // Single-column drag: reorder within a function or reassign it.
    const sourceOp = activeParsed.operation;
    const { column } = activeParsed;
    const sourceIdx = aggregations.findIndex(
      entry => entry.operation === sourceOp
    );
    if (sourceIdx < 0) return;

    // Hovering the card background keeps the column in its own function.
    const targetOp = overParsed?.operation ?? sourceOp;
    const targetIdx = aggregations.findIndex(
      entry => entry.operation === targetOp
    );
    if (targetIdx < 0) return;

    // Type validation: snap back if the target function rejects the
    // column's type (e.g. Sum of a String column).
    const type = columnTypes[column];
    if (
      type != null &&
      !AggregationUtils.isValidOperation(targetOp as AggregationOperation, type)
    ) {
      return;
    }

    if (sourceOp === targetOp) {
      // Reorder within the function's own column list.
      const entry = aggregations[sourceIdx];
      const fromColIdx = entry.selected.indexOf(column);
      if (fromColIdx < 0) return;
      const overColIdx =
        overParsed?.column == null
          ? -1
          : entry.selected.indexOf(overParsed.column);
      const toColIdx = overColIdx < 0 ? entry.selected.length - 1 : overColIdx;
      if (fromColIdx === toColIdx) return;
      const next = aggregations.slice();
      next[sourceIdx] = {
        ...entry,
        selected: moveItem(entry.selected, fromColIdx, toColIdx),
      };
      onAggregationSettingsChange({
        ...aggregationSettings,
        aggregations: next,
      });
      return;
    }

    // Cross-function move. Splice the column into the target function
    // (de-duped, at the hovered slot or the end) and drop it from the
    // source, removing the source function if it loses its last column.
    const targetSelected = aggregations[targetIdx].selected;
    const overColIdx =
      overParsed?.column == null
        ? -1
        : targetSelected.indexOf(overParsed.column);
    const insertAt = overColIdx < 0 ? targetSelected.length : overColIdx;
    let next = aggregations.map(entry => ({
      ...entry,
      selected: entry.selected.slice(),
    }));
    next[sourceIdx].selected = next[sourceIdx].selected.filter(
      c => c !== column
    );
    if (!next[targetIdx].selected.includes(column)) {
      next[targetIdx].selected.splice(
        Math.min(insertAt, next[targetIdx].selected.length),
        0,
        column
      );
    }
    if (next[sourceIdx].selected.length === 0) {
      next = next.filter((_, i) => i !== sourceIdx);
    }
    onAggregationSettingsChange({
      ...aggregationSettings,
      aggregations: next,
    });
    return;
  }
  // Columns from the rollup/pivot cards can never land in aggregations.
  if (toId === AGGREGATIONS_DROPPABLE) return;

  const lists: Record<
    string,
    { items: string[]; set: (next: string[]) => void }
  > = {
    [ROLLUP_ROWS_DROPPABLE]: {
      items: rollupRows,
      set: onRollupRowsChange,
    },
    [PIVOT_COLUMNS_DROPPABLE]: {
      items: pivotColumns,
      set: onPivotColumnsChange,
    },
  };
  const from = lists[fromId];
  const to = lists[toId];
  if (from == null || to == null) return;

  // Recover the moved column name from the active id (`${container}:${name}`).
  const colonIdx = activeId.indexOf(':');
  if (colonIdx === -1) return;
  const moved = activeId.slice(colonIdx + 1);
  const fromIdx = from.items.indexOf(moved);
  if (fromIdx < 0) return;

  let toIdx: number;
  if (overId === toId) {
    // Dropped on container background — append.
    toIdx = to.items.length;
  } else {
    const overColon = overId.indexOf(':');
    const overName = overColon === -1 ? overId : overId.slice(overColon + 1);
    const overIdx = to.items.indexOf(overName);
    toIdx = overIdx < 0 ? to.items.length : overIdx;
  }

  if (fromId === toId) {
    if (fromIdx === toIdx) return;
    from.set(moveItem(from.items, fromIdx, toIdx));
    return;
  }

  // Cross-list move. Drop silently if the column already exists in the
  // destination list (no duplicates within a card).
  if (to.items.includes(moved)) return;
  from.set(removeAt(from.items, fromIdx));
  const nextTo = to.items.slice();
  nextTo.splice(Math.min(toIdx, nextTo.length), 0, moved);
  to.set(nextTo);
}
