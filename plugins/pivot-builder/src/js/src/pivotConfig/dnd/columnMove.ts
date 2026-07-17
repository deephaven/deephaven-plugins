import { ROLLUP_ROWS_DROPPABLE, PIVOT_COLUMNS_DROPPABLE } from './dndIds';
import { moveItem } from './arrayUtils';

/**
 * Drag-only snapshot of the two column cards, keyed by container id and
 * holding column *item ids* (see {@link columnItemId}) in visual order. This is
 * the "multiple sortable containers" state dnd-kit mutates during a drag; the
 * real card state is only updated once, on drop.
 */
export type ColumnLists = Record<string, string[]>;

/**
 * Which column container currently holds `id`. Accepts either a column item id
 * (looked up in the lists) or a container id itself. Returns null when the id
 * belongs to neither column card (e.g. an aggregation id or the aggregations
 * container hovered while dragging a column).
 */
export function findColumnContainer(
  lists: ColumnLists,
  id: string
): string | null {
  if (id === ROLLUP_ROWS_DROPPABLE || id === PIVOT_COLUMNS_DROPPABLE) {
    return id;
  }
  if (lists[ROLLUP_ROWS_DROPPABLE]?.includes(id)) {
    return ROLLUP_ROWS_DROPPABLE;
  }
  if (lists[PIVOT_COLUMNS_DROPPABLE]?.includes(id)) {
    return PIVOT_COLUMNS_DROPPABLE;
  }
  return null;
}

/**
 * Move `activeId` from its current column card into the card containing
 * `overId`, inserting before the hovered item (or after it when `insertAfter`
 * is true — i.e. the pointer is past the hovered row's lower edge), or at the
 * end when `overId` is the destination container itself. Returns the SAME
 * `lists` reference when the move is a no-op (same card, unknown ids, or the
 * destination already holds the item) so callers can skip a state update.
 *
 * Used from `onDragOver`; within-card reordering is left to dnd-kit's
 * SortableContext during the drag and committed by {@link reorderColumnWithin}.
 */
export function moveColumnAcross(
  lists: ColumnLists,
  activeId: string,
  overId: string,
  insertAfter: boolean
): ColumnLists {
  const from = findColumnContainer(lists, activeId);
  const to = findColumnContainer(lists, overId);
  if (from == null || to == null || from === to) {
    return lists;
  }
  const toItems = lists[to];
  if (toItems.includes(activeId)) {
    return lists;
  }
  let newIndex: number;
  if (overId === to) {
    newIndex = toItems.length;
  } else {
    const overIndex = toItems.indexOf(overId);
    newIndex =
      overIndex < 0 ? toItems.length : overIndex + (insertAfter ? 1 : 0);
  }
  return {
    ...lists,
    [from]: lists[from].filter(id => id !== activeId),
    [to]: [...toItems.slice(0, newIndex), activeId, ...toItems.slice(newIndex)],
  };
}

/**
 * Reorder `activeId` within its own column card so it lands at `overId`'s slot.
 * Returns the SAME `lists` reference when the two ids are in different cards or
 * already adjacent. Used from `onDragEnd` to commit the final same-card order
 * (dnd-kit only animates this during the drag; it doesn't mutate state).
 */
export function reorderColumnWithin(
  lists: ColumnLists,
  activeId: string,
  overId: string
): ColumnLists {
  const container = findColumnContainer(lists, activeId);
  if (container == null || findColumnContainer(lists, overId) !== container) {
    return lists;
  }
  const items = lists[container];
  const fromIdx = items.indexOf(activeId);
  const toIdx = items.indexOf(overId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
    return lists;
  }
  return { ...lists, [container]: moveItem(items, fromIdx, toIdx) };
}
