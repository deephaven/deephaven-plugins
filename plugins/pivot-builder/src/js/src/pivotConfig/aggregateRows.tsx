/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react';
import { Item, Picker } from '@deephaven/components';
import { DndKitSortable, DndKitUtilities } from '@deephaven/iris-grid';
import {
  AggregationUtils,
  type Aggregation,
  type AggregationOperation,
} from '@deephaven/iris-grid';
import { AGGREGATIONS_DROPPABLE, aggregationColumnId } from './dndIds';
import { sortableRowStyle } from './dndStyles';
import {
  DragGrip,
  DropGhost,
  HiddenGrip,
  RemoveButton,
  RowLabel,
  StaticGrip,
} from './rowParts';

const { SortableContext, useSortable, verticalListSortingStrategy } =
  DndKitSortable;
const { CSS } = DndKitUtilities;

export type AggregateSelectRowProps = {
  id: string;
  operation: string;
  columnLabels: readonly string[];
  availableOperations: readonly string[];
  /**
   * Column name -> Deephaven column type for every column in the table. Used
   * to disable aggregate functions in the picker that aren't valid for the
   * group's columns (e.g. Sum on a String column).
   */
  columnTypes: Readonly<Record<string, string>>;
  onOperationChange: (operation: string) => void;
  onDelete: () => void;
  /**
   * When provided, each column label renders with its own remove button so a
   * single column can be dropped from the function's selection. Used by the
   * grouped (non-pivot) layout where one row lists all of a function's
   * columns; omitted in the ungrouped layout where each function/column pair
   * is already its own deletable row.
   */
  onDeleteColumn?: (column: string) => void;
  /**
   * When false, a function's columns render as removable rows but are not
   * draggable — only whole function groups can be reordered. Used by the
   * aggregation-only view where per-column drag/reassignment is disabled.
   */
  columnsDraggable?: boolean;
  /**
   * When true the column lines are hidden and only the aggregate-function line
   * renders, so the group can be dragged/reordered as a single atomic item.
   * Applied to every row while a whole-function drag is in flight.
   */
  collapsed?: boolean;
  /**
   * When a column is being dragged in from ANOTHER group, its name and the
   * index at which to render a ghost preview in this group's column list.
   * Mirrors the cross-card DropIndicator so a cross-group reassignment shows
   * where the column will land. Null index = no preview.
   */
  columnDropLabel?: string;
  columnDropIndex?: number | null;
  /**
   * Name of a column in THIS group that is being dragged out into another
   * group; it collapses out of this group's list (the ghost preview lives in
   * the target group) so the drag reads as a move.
   */
  collapseColumn?: string;
  /**
   * When true the aggregate function is rendered as plain read-only text
   * (just the operation name) instead of an editable picker, and the column
   * labels are omitted. Used for the collapsed Count row in the ungrouped
   * (pivot) layout.
   */
  staticOperation?: boolean;
};

/**
 * A single draggable column line inside an aggregate function group. Columns
 * can be reordered within their function or dragged onto another function to
 * reassign them; the drag-end handler validates the target function against
 * the column's type and snaps back on an invalid drop.
 */
function AggregateColumnRow({
  operation,
  column,
  onDelete,
  collapsed = false,
}: {
  operation: string;
  column: string;
  onDelete: () => void;
  collapsed?: boolean;
}): JSX.Element {
  const id = aggregationColumnId(operation, column);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'aggregation-column',
      container: AGGREGATIONS_DROPPABLE,
      operation,
      column,
    },
  });
  const style = sortableRowStyle({
    collapsed,
    transform,
    transition,
    isDragging,
    // In this nested SortableContext dnd-kit hands the *displaced* sibling
    // rows a 0-duration (`transform linear`) transition, so they snap to their
    // new slot instead of sliding. Normalize any active transition to a smooth
    // transform tween so a same-group reorder animates like the other cards.
    draggingTransition: 'transform 200ms ease, max-height 150ms ease',
  });
  return (
    <div ref={setNodeRef} className="pivot-agg-row-line" style={style}>
      <RowLabel>{column}</RowLabel>
      <RemoveButton tooltip="Remove column" onClick={onDelete} />
      <DragGrip
        activatorRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
      />
    </div>
  );
}

export function formatAggLabel(entry: Aggregation): string {
  return entry.selected.length > 0
    ? `${entry.operation} (${entry.selected.join(', ')})`
    : entry.operation;
}

/**
 * Two-line aggregate row: the aggregate function rendered as a quiet
 * Spectrum picker (changeable inline) on the first line and the column
 * label on the second. Used both for the grouped layout (one row per
 * function, all columns joined) and the ungrouped layout (one row per
 * function/column pair).
 */
export function AggregateSelectRow({
  id,
  operation,
  columnLabels,
  availableOperations,
  columnTypes,
  onOperationChange,
  onDelete,
  onDeleteColumn,
  columnsDraggable = true,
  collapsed = false,
  columnDropLabel,
  columnDropIndex = null,
  collapseColumn,
  staticOperation = false,
}: AggregateSelectRowProps): JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: 'aggregation', container: AGGREGATIONS_DROPPABLE },
  });
  const style: React.CSSProperties = {
    // Stack the function/columns vertically so the delete + drag icons can
    // sit on the same centered line as the aggregate-function picker (the
    // column labels flow underneath).
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
    transform: CSS.Transform.toString(transform),
    transition,
    // Fade the source row in place while dragging (its overlay clone follows
    // the cursor), matching Organize Columns' ghost treatment.
    opacity: isDragging ? 0.5 : 1,
  };
  const columnItemIds = columnLabels.map(label =>
    aggregationColumnId(operation, label)
  );
  // Disable any aggregate function that isn't valid for every column in this
  // group (the function applies to all of them). Columns with an unknown type
  // are skipped so a missing type doesn't over-restrict the picker.
  const disabledOperationKeys = useMemo(() => {
    const types = columnLabels
      .map(label => columnTypes[label])
      .filter((t): t is string => t != null);
    if (types.length === 0) {
      return undefined;
    }
    return availableOperations.filter(
      op =>
        !types.every(type =>
          AggregationUtils.isValidOperation(op as AggregationOperation, type)
        )
    );
  }, [availableOperations, columnLabels, columnTypes]);
  let columnsContent: React.ReactNode = null;
  if (!staticOperation && !collapsed) {
    if (onDeleteColumn != null && columnsDraggable) {
      const columnRows = columnLabels.map(label => (
        <AggregateColumnRow
          key={label}
          operation={operation}
          column={label}
          onDelete={() => onDeleteColumn(label)}
          collapsed={label === collapseColumn}
        />
      ));
      // Splice a ghost row where a column dragged in from another group would
      // land, mirroring the cross-card DropIndicator.
      let columnChildren: React.ReactNode = columnRows;
      if (columnDropIndex != null && columnDropLabel != null) {
        const clamped = Math.max(
          0,
          Math.min(columnDropIndex, columnRows.length)
        );
        columnChildren = [
          ...columnRows.slice(0, clamped),
          <DropGhost
            key="agg-column-drop-ghost"
            className="pivot-agg-row-line"
            label={columnDropLabel}
            tooltip="Remove column"
          />,
          ...columnRows.slice(clamped),
        ];
      }
      columnsContent = (
        <SortableContext
          items={columnItemIds}
          strategy={verticalListSortingStrategy}
        >
          {columnChildren}
        </SortableContext>
      );
    } else if (onDeleteColumn != null) {
      // Aggregation-only view: columns are removable but not draggable; only
      // whole function groups reorder. A hidden grip spacer keeps the remove
      // buttons aligned with the draggable function line above.
      columnsContent = columnLabels.map(label => (
        <div key={label} className="pivot-agg-row-line">
          <RowLabel>{label}</RowLabel>
          <RemoveButton
            tooltip="Remove column"
            onClick={() => onDeleteColumn(label)}
          />
          <HiddenGrip />
        </div>
      ));
    } else {
      columnsContent = columnLabels.map(label => (
        <RowLabel key={label}>{label}</RowLabel>
      ));
    }
  }
  return (
    <div
      ref={setNodeRef}
      className="pivot-row"
      style={style}
      data-pivot-agg-op={operation}
    >
      <div className="pivot-agg-row-line">
        <div className="pivot-agg-row-picker">
          {staticOperation ? (
            <RowLabel columnName={false}>{operation}</RowLabel>
          ) : (
            <Picker
              isQuiet
              aria-label="Aggregation function"
              selectedKey={operation}
              disabledKeys={disabledOperationKeys}
              onChange={key => {
                if (key != null) {
                  onOperationChange(String(key));
                }
              }}
            >
              {availableOperations.map(op => (
                <Item key={op} textValue={op}>
                  {op}
                </Item>
              ))}
            </Picker>
          )}
        </div>
        <RemoveButton onClick={onDelete} />
        <DragGrip
          activatorRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
        />
      </div>
      {columnsContent}
    </div>
  );
}

export function AggregateRowPreview({
  entry,
  label,
}: {
  entry: Aggregation;
  label?: string;
}): JSX.Element {
  return (
    <div className="pivot-row pivot-row--dragging">
      <RowLabel columnName={false}>{label ?? formatAggLabel(entry)}</RowLabel>
      <RemoveButton />
      <StaticGrip />
    </div>
  );
}
