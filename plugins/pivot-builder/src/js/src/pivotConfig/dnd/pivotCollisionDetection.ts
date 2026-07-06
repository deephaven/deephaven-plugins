import { DndKitCore } from '@deephaven/iris-grid';
import { parseAggregationId } from './dndIds';

const { closestCenter } = DndKitCore;

/**
 * Collision detection wrapping `closestCenter`. When dragging a single
 * aggregate column, the whole-group function-row droppable (and the list
 * container) span the entire group, so near the group's vertical center their
 * large rects win `closestCenter` over the individual column rects — the
 * nested column sort then sees an `over` outside its items and snaps the
 * reorder back to the source. Restrict the candidates to aggregate-column
 * droppables for column drags so the reorder stays stable; every other drag
 * uses the default.
 */
const pivotCollisionDetection: DndKitCore.CollisionDetection = args => {
  const activeParsed = parseAggregationId(String(args.active.id));
  if (activeParsed?.column == null) {
    return closestCenter(args);
  }
  const droppableContainers = args.droppableContainers.filter(
    container => parseAggregationId(String(container.id))?.column != null
  );
  return closestCenter({ ...args, droppableContainers });
};

export default pivotCollisionDetection;
