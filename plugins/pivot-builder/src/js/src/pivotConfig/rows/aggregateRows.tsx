/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react';
import { Item, Picker } from '@deephaven/components';
import { DndKitSortable, DndKitUtilities } from '@deephaven/iris-grid';
import {
  AggregationUtils,
  type Aggregation,
  type AggregationOperation,
} from '@deephaven/iris-grid';
import { AGGREGATIONS_DROPPABLE, aggregationColumnId } from '../dnd/dndIds';
import { sortableRowStyle } from '../dnd/dndStyles';
import {
  DragGrip,
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
   * Draggable column items (stable id + display name) for this group, in
   * visual order, reflecting the live drag preview. Each id may still be
   * encoded with a DIFFERENT group's operation while a column is being dragged
   * in from there. When omitted, the items are derived from `columnLabels`.
   * Only used by the draggable-columns layout.
   */
  columnItems?: { id: string; column: string }[];
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
 * the column's type and snaps back on an invalid drop. `id` is the column's
 * stable sortable id (which stays encoded with its ORIGINAL group while it is
 * previewed inside another group during a drag), independent of `operation`,
 * which is the group this row currently renders in.
 */
function AggregateColumnRow({
  id,
  operation,
  column,
  onDelete,
  stale = false,
}: {
  id: string;
  operation: string;
  column: string;
  onDelete: () => void;
  /** Column no longer exists on the live table — renders struck through. */
  stale?: boolean;
}): JSX.Element {
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
    collapsed: false,
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
      <RowLabel stale={stale}>{column}</RowLabel>
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
  columnItems,
  staticOperation = false,
}: AggregateSelectRowProps): JSX.Element {
  // Draggable column items in visual order. Falls back to `columnLabels` when
  // no preview is supplied (the preview only exists mid-drag).
  const items =
    columnItems ??
    columnLabels.map(label => ({
      id: aggregationColumnId(operation, label),
      column: label,
    }));
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
    // `columnCount` lets the collision detection re-include this group's
    // function-row droppable once it's emptied, so a column dragged out of a
    // single-item group can be dropped back onto it.
    data: {
      type: 'aggregation',
      container: AGGREGATIONS_DROPPABLE,
      columnCount: items.length,
    },
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
      // Nested SortableContext: columns reorder within their group and hop
      // between groups via the drag preview (which reassigns the moved id to
      // this group's item list), so dnd-kit slides the gap in both cases.
      columnsContent = (
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map(item => (
            <AggregateColumnRow
              key={item.id}
              id={item.id}
              operation={operation}
              column={item.column}
              stale={columnTypes[item.column] == null}
              onDelete={() => onDeleteColumn(item.column)}
            />
          ))}
        </SortableContext>
      );
    } else if (onDeleteColumn != null) {
      // Aggregation-only view: columns are removable but not draggable; only
      // whole function groups reorder. A hidden grip spacer keeps the remove
      // buttons aligned with the draggable function line above.
      columnsContent = columnLabels.map(label => (
        <div key={label} className="pivot-agg-row-line">
          <RowLabel stale={columnTypes[label] == null}>{label}</RowLabel>
          <RemoveButton
            tooltip="Remove column"
            onClick={() => onDeleteColumn(label)}
          />
          <HiddenGrip />
        </div>
      ));
    } else {
      columnsContent = columnLabels.map(label => (
        <RowLabel key={label} stale={columnTypes[label] == null}>
          {label}
        </RowLabel>
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
