import type { MutableRefObject } from 'react';
import { DndKitCore } from '@deephaven/iris-grid';
import { parseAggregationId } from './dndIds';

const { closestCenter } = DndKitCore;

/**
 * Build the collision detection used while dragging inside the pivot config.
 *
 * When dragging a single aggregate column, the whole-group function-row
 * droppable (and the list container) span the entire group, so near the
 * group's vertical center their large rects win `closestCenter` over the
 * individual column rects — the nested column sort then sees an `over` outside
 * its items and snaps the reorder back to the source. Restrict the candidates
 * to aggregate-column droppables for column drags so the reorder stays stable;
 * every other drag uses the default `closestCenter`.
 *
 * Exception: an *empty* group's function-row droppable is kept as a candidate.
 * Dragging the sole column out of a single-item group leaves it with no column
 * rows, so without this the emptied group has no droppable and the column
 * can't be dropped onto it. An empty group has no column rows to compete with,
 * so re-including it doesn't reintroduce the snap-back above.
 *
 * Stabilization (dnd-kit's multiple-containers pattern): moving a column into a
 * group empties its former group, which then re-enters the candidate list and
 * can steal the target back on the next frame — the column ping-pongs between
 * the two while the cursor is stationary (flicker). For one frame after such a
 * move (`recentlyMovedToNewGroupRef`) pin `over` to the dragged column itself
 * so the layout can settle before the next real collision test.
 */
export default function createPivotCollisionDetection(
  recentlyMovedToNewGroupRef: MutableRefObject<boolean>
): DndKitCore.CollisionDetection {
  return args => {
    const activeId = String(args.active.id);
    const activeParsed = parseAggregationId(activeId);
    if (activeParsed?.column == null) {
      return closestCenter(args);
    }
    if (recentlyMovedToNewGroupRef.current) {
      return [{ id: activeId }];
    }
    const droppableContainers = args.droppableContainers.filter(container => {
      const parsed = parseAggregationId(String(container.id));
      if (parsed == null) {
        return false;
      }
      if (parsed.column != null) {
        return true;
      }
      // Function-row (group) droppable: only a candidate when its group is empty.
      return container.data.current?.columnCount === 0;
    });
    return closestCenter({ ...args, droppableContainers });
  };
}
