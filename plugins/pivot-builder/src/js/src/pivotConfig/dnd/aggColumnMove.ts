import type { AggregationSettings } from '@deephaven/iris-grid';
import { aggregationColumnId, parseAggregationId } from './dndIds';
import { moveItem } from './arrayUtils';

/**
 * One aggregate-function group in the drag-only preview: its operation plus the
 * column *item ids* it currently holds, in visual order. Ids stay encoded with
 * their ORIGINAL operation ({@link aggregationColumnId}) for the whole drag —
 * even after a column is previewed into another group — so dnd-kit keeps
 * tracking the dragged item by a stable id. The owning group is given by the
 * array position, not by the id.
 */
export interface AggColGroup {
  operation: string;
  columnIds: string[];
}

/** Drag-only snapshot of every aggregate group's columns (see AggColGroup). */
export type AggColPreview = AggColGroup[];

/** Build a preview from committed aggregation settings. */
export function toAggColPreview(
  aggregations: AggregationSettings['aggregations']
): AggColPreview {
  return aggregations.map(entry => ({
    operation: entry.operation as string,
    columnIds: entry.selected.map(column =>
      aggregationColumnId(entry.operation as string, column)
    ),
  }));
}

/** Index of the group whose column list currently holds `id`, or -1. */
export function findAggColGroupIndex(
  preview: AggColPreview,
  id: string
): number {
  return preview.findIndex(group => group.columnIds.includes(id));
}

/**
 * Target group index for an `over` id during a column drag: the group hovered
 * directly (its function-line row id), or the group currently rendering the
 * hovered column. Returns -1 for anything outside the aggregate groups.
 */
export function resolveOverGroupIndex(
  preview: AggColPreview,
  overId: string
): number {
  const parsed = parseAggregationId(overId);
  if (parsed == null) {
    return -1;
  }
  if (parsed.column == null) {
    return preview.findIndex(group => group.operation === parsed.operation);
  }
  return findAggColGroupIndex(preview, overId);
}

/**
 * Move `activeId` out of its current group and into the group containing
 * `overId`, inserting before the hovered column (or after it when
 * `insertAfter`), or at the end when `overId` is a group's function-line row.
 * Returns the SAME `preview` reference for a no-op (same group or unknown ids)
 * so callers can skip a state update. Mirrors {@link moveColumnAcross} for the
 * rollup/pivot cards; used from `onDragOver`.
 */
export function moveAggColAcross(
  preview: AggColPreview,
  activeId: string,
  overId: string,
  insertAfter: boolean
): AggColPreview {
  const fromIdx = findAggColGroupIndex(preview, activeId);
  const toIdx = resolveOverGroupIndex(preview, overId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
    return preview;
  }
  const toItems = preview[toIdx].columnIds;
  let insertAt: number;
  if (parseAggregationId(overId)?.column == null) {
    insertAt = toItems.length;
  } else {
    const overIndex = toItems.indexOf(overId);
    insertAt =
      overIndex < 0 ? toItems.length : overIndex + (insertAfter ? 1 : 0);
  }
  return preview.map((group, i) => {
    if (i === fromIdx) {
      return {
        ...group,
        columnIds: group.columnIds.filter(id => id !== activeId),
      };
    }
    if (i === toIdx) {
      return {
        ...group,
        columnIds: [
          ...toItems.slice(0, insertAt),
          activeId,
          ...toItems.slice(insertAt),
        ],
      };
    }
    return group;
  });
}

/**
 * Reorder `activeId` within its own group so it lands at `overId`'s slot.
 * Returns the SAME `preview` reference when the ids are in different groups or
 * already adjacent. Used from `onDragEnd` to commit the final same-group order.
 */
export function reorderAggColWithin(
  preview: AggColPreview,
  activeId: string,
  overId: string
): AggColPreview {
  const fromIdx = findAggColGroupIndex(preview, activeId);
  if (fromIdx < 0 || resolveOverGroupIndex(preview, overId) !== fromIdx) {
    return preview;
  }
  const items = preview[fromIdx].columnIds;
  const from = items.indexOf(activeId);
  const to = items.indexOf(overId);
  if (from < 0 || to < 0 || from === to) {
    return preview;
  }
  return preview.map((group, i) =>
    i === fromIdx ? { ...group, columnIds: moveItem(items, from, to) } : group
  );
}

/**
 * Collapse a preview back to `[operation, columns]` pairs: derive each group's
 * column names from its ids (de-duped, order preserved — a column merged into a
 * group that already had it collapses to one entry) and drop groups left with
 * no columns.
 */
export function fromAggColPreview(
  preview: AggColPreview
): { operation: string; selected: string[] }[] {
  return preview
    .map(group => {
      const seen = new Set<string>();
      const selected: string[] = [];
      group.columnIds.forEach(id => {
        const column = parseAggregationId(id)?.column;
        if (column != null && !seen.has(column)) {
          seen.add(column);
          selected.push(column);
        }
      });
      return { operation: group.operation, selected };
    })
    .filter(group => group.selected.length > 0);
}
