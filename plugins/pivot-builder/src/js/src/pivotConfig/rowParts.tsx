import { Button } from '@deephaven/components';
import { vsTrash } from '@deephaven/icons';
import { DndKitSortable } from '@deephaven/iris-grid';
import GripIcon from './GripIcon';
import { useGrowInStyle } from './dndStyles';

const { useSortable } = DndKitSortable;
type UseSortableReturn = ReturnType<typeof useSortable>;

/** Ghost trash button shared by every pivot row, ghost, and preview. */
export function RemoveButton({
  onClick,
  tooltip = 'Remove',
}: {
  onClick?: () => void;
  tooltip?: string;
}): JSX.Element {
  return (
    <Button
      kind="ghost"
      className="btn-small pivot-row-btn"
      icon={vsTrash}
      tooltip={tooltip}
      onClick={onClick ?? (() => undefined)}
    />
  );
}

/** Row label; `columnName` adds the `pivot-column-name` modifier (default). */
export function RowLabel({
  children,
  columnName = true,
}: {
  children: React.ReactNode;
  columnName?: boolean;
}): JSX.Element {
  return (
    <span
      className={
        columnName ? 'pivot-row-label pivot-column-name' : 'pivot-row-label'
      }
    >
      {children}
    </span>
  );
}

/** Drag-activator grip: wires the sortable activator ref + drag handlers. */
export function DragGrip({
  activatorRef,
  attributes,
  listeners,
}: {
  activatorRef: UseSortableReturn['setActivatorNodeRef'];
  attributes: UseSortableReturn['attributes'];
  listeners: UseSortableReturn['listeners'];
}): JSX.Element {
  return (
    <span
      ref={activatorRef}
      className="pivot-grip"
      aria-label="Drag to re-order"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...attributes}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...listeners}
    >
      <GripIcon />
    </span>
  );
}

/** Non-interactive grip shown in ghosts / drag-overlay previews. */
export function StaticGrip(): JSX.Element {
  return (
    <span className="pivot-grip" aria-hidden>
      <GripIcon />
    </span>
  );
}

/** Empty grip-sized spacer that keeps non-draggable rows aligned. */
export function HiddenGrip(): JSX.Element {
  return <span className="pivot-grip pivot-grip--hidden" aria-hidden />;
}

/**
 * Ghosted preview of a dragged row shown at the slot where a cross-card /
 * cross-group drop will land. Grows in on mount (so it slides open as the
 * source row collapses shut) and mirrors the row layout with an item-shaped
 * ghost instead of a blank gap. `className` selects the row shape
 * (`pivot-row` vs `pivot-agg-row-line`).
 */
export function DropGhost({
  className,
  label,
  tooltip,
}: {
  className: string;
  label: string;
  tooltip?: string;
}): JSX.Element {
  const growStyle = useGrowInStyle(0.5);
  return (
    <div
      className={`${className} pivot-drop-indicator`}
      aria-hidden
      style={growStyle}
    >
      <RowLabel>{label}</RowLabel>
      <RemoveButton tooltip={tooltip} />
      <StaticGrip />
    </div>
  );
}
