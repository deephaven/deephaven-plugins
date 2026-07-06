import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  AggregationUtils,
  DndKitCore,
  type AggregationOperation,
  type AggregationSettings,
} from '@deephaven/iris-grid';
import {
  AGGREGATIONS_DROPPABLE,
  PIVOT_COLUMNS_DROPPABLE,
  ROLLUP_ROWS_DROPPABLE,
  aggregationRowId,
  columnRowId,
  parseAggregationId,
  resolveContainerOfId,
} from './dndIds';
import { applyPivotDragEnd } from './applyPivotDragEnd';
import { ColumnRowPreview } from '../rows/columnRows';
import { AggregateRowPreview } from '../rows/aggregateRows';

const { MeasuringStrategy, PointerSensor, useSensor, useSensors } = DndKitCore;

export interface UsePivotDndParams {
  rollupRows: string[];
  pivotColumns: string[];
  aggregationSettings: AggregationSettings;
  columnTypes: Readonly<Record<string, string>>;
  onRollupRowsChange: (next: string[]) => void;
  onPivotColumnsChange: (next: string[]) => void;
  onAggregationSettingsChange: (next: AggregationSettings) => void;
}

export interface UsePivotDndResult {
  /** Source droppable of the in-flight drag; null when idle. */
  dragSource: string | null;
  sensors: ReturnType<typeof useSensors>;
  measuring: { droppable: { strategy: DndKitCore.MeasuringStrategy } };
  /** Container of the in-flight drag; survives the drop for the overlay. */
  activeContainerRef: MutableRefObject<string | null>;
  handleDragStart: (event: DndKitCore.DragStartEvent) => void;
  handleDragOver: (event: DndKitCore.DragOverEvent) => void;
  handleDragEnd: (event: DndKitCore.DragEndEvent) => void;
  handleDragCancel: () => void;
  pinOverlayToCursor: DndKitCore.Modifier;
  rollupItemIds: string[];
  pivotItemIds: string[];
  aggItemIds: string[];
  /** Column being dragged into the OTHER column card, or null. */
  crossCardColumnLeaving: { container: string; column: string } | null;
  /** Cross-group aggregate-column drop preview, or null. */
  aggColumnDrop: {
    targetOp: string;
    sourceOp: string;
    column: string;
    overColumn: string;
  } | null;
  /** True while a whole aggregate-function group is being dragged. */
  isDraggingAggregationGroup: boolean;
  /** Insertion index for a cross-card column drop indicator, or null. */
  columnInsertionIndex: (
    targetContainer: string,
    items: readonly string[]
  ) => number | null;
  /** Name of the column currently dragged from a column card, or null. */
  activeColumnName: string | null;
  /** Contents rendered inside the DragOverlay, or null when idle. */
  dragOverlayPreview: ReactNode;
}

/**
 * Encapsulates the drag-and-drop state, refs, handlers, and derived preview
 * values for {@link PivotConfigSection}. Kept as a hook (rather than inlined)
 * so the orchestrator component stays focused on layout and non-DnD state.
 */
export function usePivotDnd({
  rollupRows,
  pivotColumns,
  aggregationSettings,
  columnTypes,
  onRollupRowsChange,
  onPivotColumnsChange,
  onAggregationSettingsChange,
}: UsePivotDndParams): UsePivotDndResult {
  // Tracks the source droppable while a drag is in progress; null when
  // nothing is being dragged. Used to toggle the `is-dragging` modifier
  // on the root so the drop zones render the marching-ants effect.
  const [dragSource, setDragSource] = useState<string | null>(null);
  // Id of the droppable/row currently under the pointer during a drag.
  // Drives the cross-card insertion indicator; null when idle.
  const [overId, setOverId] = useState<string | null>(null);

  // Flip `dragSource` in `onDragStart`. With @dnd-kit's
  // MeasuringStrategy.Always (set on the DndContext), every droppable
  // is re-measured continuously, so the empty drop-zones can expand
  // from 0px to their full hit-area after the drag starts and the
  // marching-ants class is applied.
  // Track the active draggable's id for the DragOverlay preview.
  const [activeId, setActiveId] = useState<string | null>(null);
  // Container of the in-flight drag. Unlike `activeId`/`dragSource` (cleared
  // at the top of `handleDragEnd`), this survives the drop so the drag
  // overlay can still tell what kind of item it just released while it plays
  // its drop animation. Reset only on the next drag start.
  const activeContainerRef = useRef<string | null>(null);
  // True while a whole aggregate-function group is being dragged. The group
  // collapse shrinks the rows above the dragged one, which would shift the
  // overlay's anchor upward; `pinOverlayToCursor` compensates only in this
  // case (guarded by this ref) so other drags are untouched.
  const groupDragRef = useRef(false);
  // Operation of the group being dragged, so the pin effect can find its
  // live DOM row. Null unless a whole-function group drag is in flight.
  const activeAggOpRef = useRef<string | null>(null);
  // Active row's viewport top captured at drag start, from the live DOM —
  // i.e. before the group collapse reflows the list. Used to compute the
  // one-time collapse offset. Reset between drags.
  const overlayPinBaseTopRef = useRef<number | null>(null);
  // Frozen collapse offset (pre-collapse top − post-collapse top) applied to
  // the overlay transform for the whole drag. Captured once, after the
  // collapse commits but before any live reorder, so later reordering (which
  // moves the row's slot) does NOT drag the overlay around. 0 = no shift.
  const overlayPinDeltaRef = useRef(0);
  // True while an aggregation-column drag is hovering a function that rejects
  // the column's type. Drives the "not allowed" tint on the drag overlay.
  const [dropInvalid, setDropInvalid] = useState(false);
  const handleDragStart = useCallback(
    (event: DndKitCore.DragStartEvent): void => {
      const container = String(event.active.data.current?.container ?? '');
      activeContainerRef.current = container === '' ? null : container;
      // A whole-function group drag is an aggregations id with no column.
      const parsed = parseAggregationId(String(event.active.id));
      const isGroup = parsed != null && parsed.column == null;
      groupDragRef.current = isGroup;
      activeAggOpRef.current = isGroup ? parsed.operation : null;
      overlayPinDeltaRef.current = 0;
      // Capture the dragged row's top from the live DOM NOW, before our
      // `setActiveId` below triggers the collapse re-render. dnd-kit's own
      // `initial` rect is measured too late (after the collapse), so it can't
      // be used as the pre-collapse reference.
      const dragRow = isGroup
        ? document.querySelector<HTMLElement>(
            `[data-pivot-agg-op="${window.CSS.escape(parsed.operation)}"]`
          )
        : null;
      overlayPinBaseTopRef.current =
        dragRow?.getBoundingClientRect().top ?? null;
      setDragSource(container === '' ? null : container);
      setActiveId(String(event.active.id));
      setOverId(null);
      setDropInvalid(false);
    },
    []
  );

  // After the collapse commits (but before any live reorder), measure how far
  // the dragged row moved and freeze that as the overlay offset. Keyed on
  // `activeId` so it runs once per drag, synchronously post-collapse.
  useLayoutEffect(() => {
    if (activeId == null || !groupDragRef.current) {
      overlayPinDeltaRef.current = 0;
      return;
    }
    const op = activeAggOpRef.current;
    const baseTop = overlayPinBaseTopRef.current;
    if (op == null || baseTop == null) {
      overlayPinDeltaRef.current = 0;
      return;
    }
    const row = document.querySelector<HTMLElement>(
      `[data-pivot-agg-op="${window.CSS.escape(op)}"]`
    );
    overlayPinDeltaRef.current =
      row == null ? 0 : baseTop - row.getBoundingClientRect().top;
  }, [activeId]);

  // Keep the drag overlay pinned to the cursor when the collapse reflows the
  // list at drag start. The group collapse shrinks the dragged row's slot
  // upward and dnd-kit anchors the overlay to that post-collapse slot, so it
  // detaches by the height removed above. Add the frozen collapse offset to
  // the transform. Constant for the drag, so live reordering doesn't move it.
  const pinOverlayToCursor = useCallback<DndKitCore.Modifier>(args => {
    if (!groupDragRef.current || overlayPinDeltaRef.current === 0) {
      return args.transform;
    }
    return {
      ...args.transform,
      y: args.transform.y + overlayPinDeltaRef.current,
    };
  }, []);

  const handleDragOver = useCallback(
    (event: DndKitCore.DragOverEvent): void => {
      const { active, over } = event;
      const overIdStr = over == null ? null : String(over.id);
      setOverId(overIdStr);

      // Live validity feedback for a single-column aggregation drag: flag the
      // drop as invalid when the hovered function rejects the column's type.
      const activeParsed = parseAggregationId(String(active.id));
      if (activeParsed?.column == null || overIdStr == null) {
        setDropInvalid(false);
        return;
      }
      const overParsed =
        overIdStr === AGGREGATIONS_DROPPABLE
          ? null
          : parseAggregationId(overIdStr);
      const targetOp = overParsed?.operation ?? activeParsed.operation;
      const type = columnTypes[activeParsed.column];
      setDropInvalid(
        type != null &&
          !AggregationUtils.isValidOperation(
            targetOp as AggregationOperation,
            type
          )
      );
    },
    [columnTypes]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // Only measure droppables continuously *while dragging*. With
  // `MeasuringStrategy.Always` left on permanently, dnd-kit keeps its
  // droppable ResizeObserver/MutationObserver active when idle, so any
  // body-portal overlay (e.g. the Spectrum overflow menu) shifts layout,
  // triggers a re-measure, and re-renders this whole subtree — which
  // closes the just-opened menu and flickers the trigger. `WhileDragging`
  // (the default) disables idle measuring; we switch to `Always` for the
  // duration of a drag so empty drop-zones still expand to their full
  // hit-area after the marching-ants class is applied.
  const measuring = useMemo(
    () => ({
      droppable: {
        strategy:
          activeId != null
            ? MeasuringStrategy.Always
            : MeasuringStrategy.WhileDragging,
      },
    }),
    [activeId]
  );

  const handleDragEnd = useCallback(
    (event: DndKitCore.DragEndEvent): void => {
      setDragSource(null);
      setActiveId(null);
      setOverId(null);
      setDropInvalid(false);
      groupDragRef.current = false;
      activeAggOpRef.current = null;
      overlayPinBaseTopRef.current = null;
      overlayPinDeltaRef.current = 0;
      const { active, over } = event;
      if (over == null) return;
      applyPivotDragEnd({
        activeId: String(active.id),
        overId: String(over.id),
        aggregationSettings,
        rollupRows,
        pivotColumns,
        columnTypes,
        onAggregationSettingsChange,
        onRollupRowsChange,
        onPivotColumnsChange,
      });
    },
    [
      aggregationSettings,
      columnTypes,
      onAggregationSettingsChange,
      onPivotColumnsChange,
      onRollupRowsChange,
      pivotColumns,
      rollupRows,
    ]
  );

  const handleDragCancel = useCallback((): void => {
    setDragSource(null);
    setActiveId(null);
    setOverId(null);
    setDropInvalid(false);
    groupDragRef.current = false;
    activeAggOpRef.current = null;
    overlayPinBaseTopRef.current = null;
    overlayPinDeltaRef.current = 0;
  }, []);

  // Index at which a cross-card insertion indicator should render in the
  // column list `targetContainer` (or null for none). Only shown for a
  // column drag originating in the *other* column card — same-card reorders
  // already open a gap via SortableContext. The index mirrors the drop
  // position computed in `handleDragEnd`: before the hovered row, or at the
  // end when hovering the empty container background.
  const columnInsertionIndex = useCallback(
    (targetContainer: string, items: readonly string[]): number | null => {
      if (activeId == null || overId == null) {
        return null;
      }
      const activeContainer = resolveContainerOfId(activeId);
      if (
        activeContainer == null ||
        activeContainer === targetContainer ||
        (activeContainer !== ROLLUP_ROWS_DROPPABLE &&
          activeContainer !== PIVOT_COLUMNS_DROPPABLE)
      ) {
        return null;
      }
      if (resolveContainerOfId(overId) !== targetContainer) {
        return null;
      }
      if (overId === targetContainer) {
        return items.length;
      }
      const overColon = overId.indexOf(':');
      const overName = overColon === -1 ? overId : overId.slice(overColon + 1);
      const idx = items.indexOf(overName);
      return idx < 0 ? items.length : idx;
    },
    [activeId, overId]
  );

  const rollupItemIds = useMemo(
    () => rollupRows.map(n => columnRowId(ROLLUP_ROWS_DROPPABLE, n)),
    [rollupRows]
  );
  const pivotItemIds = useMemo(
    () => pivotColumns.map(n => columnRowId(PIVOT_COLUMNS_DROPPABLE, n)),
    [pivotColumns]
  );
  const aggItemIds = useMemo(
    () =>
      aggregationSettings.aggregations.map(entry =>
        aggregationRowId(entry.operation as string)
      ),
    [aggregationSettings.aggregations]
  );

  // Resolve the preview for DragOverlay.
  const activeColumnName = (() => {
    if (activeId == null) {
      return null;
    }
    const container = resolveContainerOfId(activeId);
    if (
      container !== ROLLUP_ROWS_DROPPABLE &&
      container !== PIVOT_COLUMNS_DROPPABLE
    ) {
      return null;
    }
    const colonIdx = activeId.indexOf(':');
    return colonIdx === -1 ? null : activeId.slice(colonIdx + 1);
  })();
  const activeAggregation = (() => {
    if (activeId == null) {
      return null;
    }
    const container = resolveContainerOfId(activeId);
    if (container !== AGGREGATIONS_DROPPABLE) {
      return null;
    }
    const colonIdx = activeId.indexOf(':');
    if (colonIdx === -1) {
      return null;
    }
    // Aggregation row ids are `AGGREGATIONS:<operation>`.
    const operation = activeId.slice(colonIdx + 1);
    return (
      aggregationSettings.aggregations.find(a => a.operation === operation) ??
      null
    );
  })();
  // The column being dragged when a single aggregate column (not a whole
  // function row) is in flight.
  const activeAggregationColumn = (() => {
    if (activeId == null) {
      return null;
    }
    if (resolveContainerOfId(activeId) !== AGGREGATIONS_DROPPABLE) {
      return null;
    }
    return parseAggregationId(activeId)?.column ?? null;
  })();

  // True while a whole aggregate-function group (not a single column) is being
  // dragged. Drives the collapse-to-function-line render so groups reorder as
  // atomic items.
  const isDraggingAggregationGroup = activeAggregation != null;

  // Cross-group aggregate-column drop preview: when a column is dragged over a
  // DIFFERENT function group that accepts its type, render a ghost of the
  // column at the hovered slot in the target group. Same-group reorders are
  // handled by the nested SortableContext, so those are excluded here.
  const aggColumnDrop = useMemo(() => {
    if (activeId == null || overId == null) {
      return null;
    }
    const active = parseAggregationId(activeId);
    if (active?.column == null) {
      return null;
    }
    const over = parseAggregationId(overId);
    if (over?.column == null || over.operation === active.operation) {
      return null;
    }
    const type = columnTypes[active.column];
    if (
      type != null &&
      !AggregationUtils.isValidOperation(
        over.operation as AggregationOperation,
        type
      )
    ) {
      return null;
    }
    return {
      targetOp: over.operation,
      sourceOp: active.operation,
      column: active.column,
      overColumn: over.column,
    };
  }, [activeId, overId, columnTypes]);

  // A rollup/pivot column being dragged into the OTHER column card. Drives the
  // source row's collapse so the column reads as moving (a single ghost lives
  // in the target card). Null when the target already has the column (the drop
  // would be a no-op, so the source stays put).
  const crossCardColumnLeaving = useMemo(() => {
    if (activeId == null || overId == null) {
      return null;
    }
    const activeContainer = resolveContainerOfId(activeId);
    const overContainer = resolveContainerOfId(overId);
    if (
      activeContainer == null ||
      overContainer == null ||
      activeContainer === overContainer ||
      (activeContainer !== ROLLUP_ROWS_DROPPABLE &&
        activeContainer !== PIVOT_COLUMNS_DROPPABLE) ||
      (overContainer !== ROLLUP_ROWS_DROPPABLE &&
        overContainer !== PIVOT_COLUMNS_DROPPABLE)
    ) {
      return null;
    }
    const colonIdx = activeId.indexOf(':');
    const column = colonIdx === -1 ? activeId : activeId.slice(colonIdx + 1);
    const targetItems =
      overContainer === ROLLUP_ROWS_DROPPABLE ? rollupRows : pivotColumns;
    if (targetItems.includes(column)) {
      return null;
    }
    return { container: activeContainer, column };
  }, [activeId, overId, rollupRows, pivotColumns]);

  // Drag overlay contents: a column preview, an aggregation preview, or
  // nothing, depending on what (if anything) is currently being dragged.
  let dragOverlayPreview: ReactNode = null;
  if (activeColumnName != null) {
    dragOverlayPreview = <ColumnRowPreview name={activeColumnName} />;
  } else if (activeAggregationColumn != null) {
    dragOverlayPreview = (
      <ColumnRowPreview name={activeAggregationColumn} invalid={dropInvalid} />
    );
  } else if (activeAggregation != null) {
    // Show just the function name so the floating chip reads as one atomic
    // group (the list collapses to match).
    dragOverlayPreview = (
      <AggregateRowPreview
        entry={activeAggregation}
        label={activeAggregation.operation as string}
      />
    );
  }

  return {
    dragSource,
    sensors,
    measuring,
    activeContainerRef,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    pinOverlayToCursor,
    rollupItemIds,
    pivotItemIds,
    aggItemIds,
    crossCardColumnLeaving,
    aggColumnDrop,
    isDraggingAggregationGroup,
    columnInsertionIndex,
    activeColumnName,
    dragOverlayPreview,
  };
}

export default usePivotDnd;
