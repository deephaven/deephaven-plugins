import classNames from 'classnames';
import { Button } from '@deephaven/components';
import { vsTrash } from '@deephaven/icons';
import { DndKitSortable } from '@deephaven/iris-grid';
import GripIcon from './GripIcon';

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

/**
 * Row label; `columnName` adds the `pivot-column-name` modifier (default).
 * `stale` adds the `pivot-column-name--stale` modifier (column no longer on
 * the live table).
 */
export function RowLabel({
  children,
  columnName = true,
  stale = false,
}: {
  children: React.ReactNode;
  columnName?: boolean;
  stale?: boolean;
}): JSX.Element {
  return (
    <span
      className={classNames('pivot-row-label', {
        'pivot-column-name': columnName,
        'pivot-column-name--stale': stale,
      })}
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

/**
 * Invisible grip-sized spacer that keeps non-draggable rows' controls aligned
 * with draggable ones. Renders the same {@link GripIcon} as a real grip (so it
 * reserves the identical width) but hidden via `pivot-grip--hidden`.
 */
export function HiddenGrip(): JSX.Element {
  return (
    <span className="pivot-grip pivot-grip--hidden" aria-hidden>
      <GripIcon />
    </span>
  );
}
