/* eslint-disable react-refresh/only-export-components */
import { Button } from '@deephaven/components';
import { vsTrash } from '@deephaven/icons';
import {
  DndKitCore,
  DndKitSortable,
  DndKitUtilities,
} from '@deephaven/iris-grid';
import GripIcon from './GripIcon';
import { columnRowId } from './dndIds';
import {
  COLLAPSING_SOURCE_STYLE,
  ROW_MAX_HEIGHT,
  useGrowInStyle,
} from './dndStyles';

const { useDroppable } = DndKitCore;
const { SortableContext, useSortable, verticalListSortingStrategy } =
  DndKitSortable;
const { CSS } = DndKitUtilities;

/**
 * Ghosted preview of the dragged column at the spot where a cross-card drop
 * will land. Mirrors the faded in-place row a same-card sortable reorder
 * shows, so cross-card drags read the same way (an item-shaped ghost, not a
 * blank gap).
 */
function DropIndicator({ label }: { label: string }): JSX.Element {
  const growStyle = useGrowInStyle(0.5);
  return (
    <div
      className="pivot-row pivot-drop-indicator"
      aria-hidden
      style={growStyle}
    >
      <span className="pivot-row-label pivot-column-name">{label}</span>
      <Button
        kind="ghost"
        className="btn-small pivot-row-btn"
        icon={vsTrash}
        tooltip="Remove"
        onClick={() => undefined}
      />
      <span className="pivot-grip" aria-hidden>
        <GripIcon />
      </span>
    </div>
  );
}

/**
 * Splice a {@link DropIndicator} into a list of rendered rows at `index`
 * (clamped to the row count). Returns the rows unchanged when `index` is
 * null.
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
    <DropIndicator key="pivot-drop-indicator" label={label} />,
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
  const style: React.CSSProperties = collapsed
    ? COLLAPSING_SOURCE_STYLE
    : {
        transform: CSS.Transform.toString(transform),
        transition:
          transition == null
            ? 'max-height 150ms ease'
            : `${transition}, max-height 150ms ease`,
        // Fade the source row in place while dragging (its overlay clone
        // follows the cursor), matching Organize Columns' ghost treatment.
        opacity: isDragging ? 0.5 : 1,
        // Explicit origin so a cross-card collapse can animate (see
        // COLLAPSING_SOURCE_STYLE).
        maxHeight: ROW_MAX_HEIGHT,
      };
  return (
    <div ref={setNodeRef} className="pivot-row" style={style}>
      <span className="pivot-row-label pivot-column-name">{name}</span>
      <Button
        kind="ghost"
        className="btn-small pivot-row-btn"
        icon={vsTrash}
        tooltip="Remove"
        onClick={onDelete}
      />
      <span
        ref={setActivatorNodeRef}
        className="pivot-grip"
        aria-label="Drag to re-order"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...attributes}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...listeners}
      >
        <GripIcon />
      </span>
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
      <span className="pivot-row-label pivot-column-name">{name}</span>
      <Button
        kind="ghost"
        className="btn-small pivot-row-btn"
        icon={vsTrash}
        tooltip="Remove"
        onClick={() => undefined}
      />
      <span className="pivot-grip" aria-hidden>
        <GripIcon />
      </span>
    </div>
  );
}
