import { DndKitSortable } from '@deephaven/iris-grid';
import { sortableRowStyle } from '../dnd/dndStyles';
import { DragGrip, RemoveButton, RowLabel } from './rowParts';

const { useSortable } = DndKitSortable;

type ColumnRowProps = {
  /** Container-independent sortable id ({@link columnItemId}). */
  id: string;
  name: string;
  /** Column card this row is currently rendered in (for dnd-kit data). */
  container: string;
  onDelete: () => void;
  /** Column no longer exists on the live table — renders struck through. */
  isStale?: boolean;
};

export function ColumnRow({
  id,
  name,
  container,
  onDelete,
  isStale = false,
}: ColumnRowProps): JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'column', container } });
  const style = sortableRowStyle({
    collapsed: false,
    transform,
    transition,
    isDragging,
    // Chain dnd-kit's own transform transition so a same-card reorder slides.
    draggingTransition: `${transition}, max-height 150ms ease`,
  });
  return (
    <div ref={setNodeRef} className="pivot-row" style={style}>
      <RowLabel stale={isStale}>{name}</RowLabel>
      <RemoveButton onClick={onDelete} />
      <DragGrip
        activatorRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
      />
    </div>
  );
}

export default ColumnRow;
