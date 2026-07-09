/* eslint-disable react-refresh/only-export-components */
import { DndKitCore, DndKitSortable } from '@deephaven/iris-grid';
import { sortableRowStyle } from '../dnd/dndStyles';
import { DragGrip, RemoveButton, RowLabel, StaticGrip } from './rowParts';

const { useDroppable } = DndKitCore;
const { SortableContext, useSortable, verticalListSortingStrategy } =
  DndKitSortable;

type DroppableListProps = {
  id: string;
  type: 'columns' | 'aggregations';
  itemIds: string[];
  isEmpty: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

/**
 * A SortableContext-wrapped container that also registers as a
 * droppable so empty lists can accept drops. `type` controls the CSS
 * class so the marching-ants decoration toggles based on the active
 * drag's source (set on the section root).
 */
export function DroppableList({
  id,
  type,
  itemIds,
  isEmpty,
  disabled,
  children,
}: DroppableListProps): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { container: id },
    disabled: disabled === true,
  });
  const baseClass =
    type === 'columns'
      ? 'pivot-droppable-columns'
      : 'pivot-droppable-aggregations';
  const stateClass = isEmpty ? 'pivot-droppable-empty' : 'pivot-droppable';
  const overClass = isOver ? ' is-dragging-over' : '';
  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`${baseClass} ${stateClass}${overClass}`}
      >
        {children}
      </div>
    </SortableContext>
  );
}

type ColumnRowProps = {
  /** Container-independent sortable id ({@link columnItemId}). */
  id: string;
  name: string;
  /** Column card this row is currently rendered in (for dnd-kit data). */
  container: string;
  onDelete: () => void;
};

export function ColumnRow({
  id,
  name,
  container,
  onDelete,
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
      <RowLabel>{name}</RowLabel>
      <RemoveButton onClick={onDelete} />
      <DragGrip
        activatorRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
      />
    </div>
  );
}

/** Static (non-dnd) rendering of a column row for use inside DragOverlay. */
export function ColumnRowPreview({
  name,
  invalid = false,
}: {
  name: string;
  invalid?: boolean;
}): JSX.Element {
  return (
    <div
      className={`pivot-row pivot-row--dragging${
        invalid ? ' pivot-drag-invalid' : ''
      }`}
    >
      <RowLabel>{name}</RowLabel>
      <RemoveButton />
      <StaticGrip />
    </div>
  );
}
