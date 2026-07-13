import {
  useCallback,
  useEffect,
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
  columnItemId,
  columnNameFromItemId,
  isColumnItemId,
  parseAggregationId,
  resolveContainerOfId,
} from './dndIds';
import { reorderAggregationGroups } from './reorderAggregationGroups';
import {
  findColumnContainer,
  moveColumnAcross,
  reorderColumnWithin,
  type ColumnLists,
} from './columnMove';
import {
  fromAggColPreview,
  findAggColGroupIndex,
  moveAggColAcross,
  reorderAggColWithin,
  resolveOverGroupIndex,
  toAggColPreview,
  type AggColPreview,
} from './aggColumnMove';
import { ColumnRowPreview } from '../rows/ColumnRowPreview';
import { AggregateRowPreview } from '../rows/aggregateRows';

const { MeasuringStrategy, PointerSensor, useSensor, useSensors } = DndKitCore;

/** Shallow equality for two string lists in order. */
function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Equality for two aggregation lists by operation + selected-column order. */
function sameAggregations(
  a: AggregationSettings['aggregations'],
  b: AggregationSettings['aggregations']
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (g, i) =>
        String(g.operation) === String(b[i].operation) &&
        sameOrder(g.selected, b[i].selected)
    )
  );
}

/**
 * Render model for one aggregate-function group: its operation and the column
 * items (stable id + display name) to render. Reflects the live drag preview
 * during a single aggregate-column drag; the committed selection otherwise.
 */
export interface AggColumnGroup {
  operation: string;
  columnItems: { id: string; column: string }[];
}

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
  /**
   * Column item ids for the Rollup card in visual order. Reflects the live
   * drag preview while a column is being dragged (so the item can hop between
   * cards), and the committed `rollupRows` otherwise.
   */
  rollupColumnIds: string[];
  /** Column item ids for the Pivot card in visual order (see above). */
  pivotColumnIds: string[];
  aggItemIds: string[];
  /**
   * Per-group aggregate column render model, reflecting the live drag preview
   * during a single aggregate-column drag. Index-aligned with
   * `aggregationSettings.aggregations`.
   */
  aggColumnGroups: AggColumnGroup[];
  /** True while a whole aggregate-function group is being dragged. */
  isDraggingAggregationGroup: boolean;
  /**
   * True while a single aggregate-column drag is hovering a function that
   * rejects the column's type (an invalid drop). Drives the disabled clone
   * treatment and the "not-allowed" cursor.
   */
  dropInvalid: boolean;
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

  // Drag-only snapshot of the two column cards (keyed by container id, holding
  // column item ids). While a column is being dragged this is mutated in
  // `onDragOver` so the item hops between the Rollup and Pivot SortableContexts
  // — dnd-kit then opens and slides the gap natively in BOTH same-card and
  // cross-card cases. Null unless a column drag is in flight; the committed
  // `rollupRows`/`pivotColumns` are the source of truth otherwise.
  const [columnPreview, setColumnPreview] = useState<ColumnLists | null>(null);
  // Mirror of `columnPreview` for reading the latest value inside the drop
  // handler (which fires on a later event than the last preview update).
  const columnPreviewRef = useRef<ColumnLists | null>(null);
  useEffect(() => {
    columnPreviewRef.current = columnPreview;
  }, [columnPreview]);

  // Drag-only snapshot of the aggregate groups' columns (per-group id lists).
  // While a single aggregate column is dragged this is mutated in `onDragOver`
  // so the column hops between function groups' nested SortableContexts —
  // dnd-kit then slides the gap open in BOTH same-group and cross-group cases.
  // Null unless a single aggregate-column drag is in flight (whole-group drags
  // and the aggregation-only view, where columns aren't draggable, don't set
  // it). The committed `aggregationSettings` is the source of truth otherwise.
  const [aggColPreview, setAggColPreview] = useState<AggColPreview | null>(
    null
  );
  const aggColPreviewRef = useRef<AggColPreview | null>(null);
  useEffect(() => {
    aggColPreviewRef.current = aggColPreview;
  }, [aggColPreview]);

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
      setDropInvalid(false);
      // Seed the column drag preview from the committed lists when a column is
      // picked up, so `onDragOver` can move it between cards without touching
      // real state until the drop.
      setColumnPreview(
        isColumnItemId(String(event.active.id))
          ? {
              [ROLLUP_ROWS_DROPPABLE]: rollupRows.map(columnItemId),
              [PIVOT_COLUMNS_DROPPABLE]: pivotColumns.map(columnItemId),
            }
          : null
      );
      // Seed the aggregate-column preview for a single-column aggregation drag
      // (a whole-function group drag has no column), so `onDragOver` can move
      // the column between groups' nested lists.
      setAggColPreview(
        parsed != null && parsed.column != null
          ? toAggColPreview(aggregationSettings.aggregations)
          : null
      );
    },
    [rollupRows, pivotColumns, aggregationSettings.aggregations]
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

      // Multiple-containers pattern: while a column is dragged over a
      // DIFFERENT column card, move it into that card in the preview so
      // dnd-kit re-registers it there and slides the gap open. Same-card
      // motion is handled by dnd-kit's SortableContext and committed on drop.
      const activeIdStr = String(active.id);
      if (isColumnItemId(activeIdStr) && overIdStr != null) {
        setColumnPreview(prev => {
          if (prev == null) {
            return prev;
          }
          const from = findColumnContainer(prev, activeIdStr);
          const to = findColumnContainer(prev, overIdStr);
          if (from == null || to == null || from === to) {
            return prev;
          }
          // Insert after the hovered row when the dragged item's top has
          // cleared the hovered row's lower edge (mirrors dnd-kit's example),
          // so the tail of a card is reachable.
          const { translated } = active.rect.current;
          const insertAfter =
            translated != null &&
            over != null &&
            translated.top > over.rect.top + over.rect.height;
          return moveColumnAcross(prev, activeIdStr, overIdStr, insertAfter);
        });
        return;
      }

      // Single aggregate-column drag: mirror the column-card pattern within the
      // aggregate groups. Move the column into the hovered group's nested list
      // (when that group accepts its type) so dnd-kit slides the gap; same-group
      // motion is left to the nested SortableContext and committed on drop.
      const activeParsed = parseAggregationId(activeIdStr);
      if (activeParsed?.column == null || overIdStr == null) {
        setDropInvalid(false);
        return;
      }
      const prev = aggColPreviewRef.current;
      if (prev == null) {
        setDropInvalid(false);
        return;
      }
      const fromIdx = findAggColGroupIndex(prev, activeIdStr);
      const toIdx = resolveOverGroupIndex(prev, overIdStr);
      if (toIdx < 0) {
        setDropInvalid(false);
        return;
      }
      // Same group: dnd-kit's nested SortableContext animates the reorder.
      if (fromIdx === toIdx) {
        setDropInvalid(false);
        return;
      }
      // Cross-group: reject (snap back, keep the column put) when the target
      // function can't take the column's type.
      const type = columnTypes[activeParsed.column];
      const invalid =
        type != null &&
        !AggregationUtils.isValidOperation(
          prev[toIdx].operation as AggregationOperation,
          type
        );
      if (invalid) {
        setDropInvalid(true);
        return;
      }
      setDropInvalid(false);
      const { translated } = active.rect.current;
      const insertAfter =
        translated != null &&
        over != null &&
        translated.top > over.rect.top + over.rect.height;
      setAggColPreview(cur =>
        cur == null
          ? cur
          : moveAggColAcross(cur, activeIdStr, overIdStr, insertAfter)
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
      const preview = columnPreviewRef.current;
      const aggPreview = aggColPreviewRef.current;
      setDragSource(null);
      setActiveId(null);
      setDropInvalid(false);
      setColumnPreview(null);
      setAggColPreview(null);
      groupDragRef.current = false;
      activeAggOpRef.current = null;
      overlayPinBaseTopRef.current = null;
      overlayPinDeltaRef.current = 0;
      const { active, over } = event;

      // Column drag: commit the previewed lists (with the final same-card
      // reorder applied) to the real card state. Cross-card moves were already
      // reflected in the preview by `onDragOver`.
      if (preview != null) {
        const committed =
          over == null
            ? preview
            : reorderColumnWithin(preview, String(active.id), String(over.id));
        const nextRollup = committed[ROLLUP_ROWS_DROPPABLE].map(
          id => columnNameFromItemId(id) ?? id
        );
        const nextPivot = committed[PIVOT_COLUMNS_DROPPABLE].map(
          id => columnNameFromItemId(id) ?? id
        );
        if (!sameOrder(nextRollup, rollupRows)) {
          onRollupRowsChange(nextRollup);
        }
        if (!sameOrder(nextPivot, pivotColumns)) {
          onPivotColumnsChange(nextPivot);
        }
        return;
      }

      // Single aggregate-column drag: commit the previewed groups (with the
      // final same-group reorder applied), merging back onto the settings so
      // per-entry fields (e.g. `invert`) survive and emptied groups drop out.
      if (aggPreview != null) {
        const committed =
          over == null
            ? aggPreview
            : reorderAggColWithin(
                aggPreview,
                String(active.id),
                String(over.id)
              );
        const byOp = new Map(
          aggregationSettings.aggregations.map(a => [String(a.operation), a])
        );
        const nextAggs = fromAggColPreview(committed).map(group => {
          const orig = byOp.get(group.operation);
          return orig != null
            ? { ...orig, selected: group.selected }
            : {
                operation: group.operation as AggregationOperation,
                selected: group.selected,
                invert: false,
              };
        });
        if (!sameAggregations(nextAggs, aggregationSettings.aggregations)) {
          onAggregationSettingsChange({
            ...aggregationSettings,
            aggregations: nextAggs,
          });
        }
        return;
      }

      if (over == null) return;
      reorderAggregationGroups({
        activeId: String(active.id),
        overId: String(over.id),
        aggregationSettings,
        onAggregationSettingsChange,
      });
    },
    [
      aggregationSettings,
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
    setDropInvalid(false);
    setColumnPreview(null);
    setAggColPreview(null);
    groupDragRef.current = false;
    activeAggOpRef.current = null;
    overlayPinBaseTopRef.current = null;
    overlayPinDeltaRef.current = 0;
  }, []);

  // Column item ids per card in visual order. During a drag these come from
  // the live preview (so the dragged item hops between cards and dnd-kit
  // animates the gap); otherwise they mirror the committed lists.
  const rollupColumnIds = useMemo(
    () =>
      columnPreview?.[ROLLUP_ROWS_DROPPABLE] ??
      rollupRows.map(n => columnItemId(n)),
    [columnPreview, rollupRows]
  );
  const pivotColumnIds = useMemo(
    () =>
      columnPreview?.[PIVOT_COLUMNS_DROPPABLE] ??
      pivotColumns.map(n => columnItemId(n)),
    [columnPreview, pivotColumns]
  );
  const aggItemIds = useMemo(
    () =>
      aggregationSettings.aggregations.map(entry =>
        aggregationRowId(entry.operation as string)
      ),
    [aggregationSettings.aggregations]
  );

  // Per-group aggregate column render model. During a single aggregate-column
  // drag this comes from the live preview (so the column hops between groups
  // and dnd-kit animates the gap); otherwise it mirrors the committed
  // selections. Index-aligned with `aggregationSettings.aggregations` (the
  // preview keeps every group, even one momentarily emptied by a drag).
  const aggColumnGroups = useMemo<AggColumnGroup[]>(() => {
    const source =
      aggColPreview ?? toAggColPreview(aggregationSettings.aggregations);
    return source.map(group => ({
      operation: group.operation,
      columnItems: group.columnIds.map(id => ({
        id,
        column: parseAggregationId(id)?.column ?? id,
      })),
    }));
  }, [aggColPreview, aggregationSettings.aggregations]);

  // Resolve the preview for DragOverlay.
  const activeColumnName =
    activeId != null && isColumnItemId(activeId)
      ? columnNameFromItemId(activeId)
      : null;
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
    rollupColumnIds,
    pivotColumnIds,
    aggItemIds,
    aggColumnGroups,
    isDraggingAggregationGroup,
    dropInvalid,
    dragOverlayPreview,
  };
}

export default usePivotDnd;
