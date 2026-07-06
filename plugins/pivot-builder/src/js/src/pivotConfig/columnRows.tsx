/* eslint-disable react-refresh/only-export-components */
import { DndKitCore, DndKitSortable } from '@deephaven/iris-grid';
import { columnRowId } from './dndIds';
import { sortableRowStyle } from './dndStyles';
import {
  DragGrip,
  DropGhost,
  RemoveButton,
  RowLabel,
  StaticGrip,
} from './rowParts';

const { useDroppable } = DndKitCore;
const { SortableContext, useSortable, verticalListSortingStrategy } =
  DndKitSortable;

/**
 * Splice a cross-card {@link DropGhost} into a list of rendered rows at
 * `index` (clamped to the row count). Returns the rows unchanged when `index`
 * is null.
 */
export function withDropIndicator(
  rows: JSX.Element[],
  index: number | null,
  label: string
): React.ReactNode {
  // Empty target cards get their own full-card drop-zone highlight (the
  // marching-ants `.pivot-droppable-empty` overlay), so skip the ghost row
  // there and let that highlight stand in.
  if (index == null || rows.length === 0) {
    return rows;
  }
  const clamped = Math.max(0, Math.min(index, rows.length));
  return [
    ...rows.slice(0, clamped),
    <DropGhost
      key="pivot-drop-indicator"
      className="pivot-row"
      label={label}
    />,
    ...rows.slice(clamped),
  ];
}

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
  name: string;
  droppableId: string;
  onDelete: () => void;
  /**
   * When true this row is the source of a column being dragged into the OTHER
   * column card, so it collapses out of this list (the drop preview lives in
   * the target card).
   */
  collapsed?: boolean;
};

export function ColumnRow({
  name,
  droppableId,
  onDelete,
  collapsed = false,
}: ColumnRowProps): JSX.Element {
  const id = columnRowId(droppableId, name);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'column', container: droppableId } });
  const style = sortableRowStyle({
    collapsed,
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
