import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { DndKitCore } from '@deephaven/iris-grid';
import { Button, GLOBAL_SHORTCUTS, Switch } from '@deephaven/components';
import { vsDiscard, vsRedo } from '@deephaven/icons';
import {
  AggregationOperation,
  AggregationUtils,
  type Aggregation,
  type AggregationSettings,
} from '@deephaven/iris-grid';
import { usePivotServiceStatus } from './PivotServiceContext';
import {
  AGGREGATIONS_DROPPABLE,
  PIVOT_COLUMNS_DROPPABLE,
  ROLLUP_ROWS_DROPPABLE,
  aggregationRowId,
  columnNameFromItemId,
} from './pivotConfig/dnd/dndIds';
import {
  COLUMN_DROP_ANIMATION,
  DRAG_OVERLAY_STYLE,
} from './pivotConfig/dnd/dndStyles';
import { ColumnRow } from './pivotConfig/rows/ColumnRow';
import { DroppableList } from './pivotConfig/rows/DroppableList';
import { AggregateSelectRow } from './pivotConfig/rows/aggregateRows';
import { usePivotDnd } from './pivotConfig/dnd/usePivotDnd';
import ServiceUnavailableMessage from './pivotConfig/controls/ServiceUnavailableMessage';
import ColumnPicker from './pivotConfig/controls/ColumnPicker';
import AggregatePicker from './pivotConfig/controls/AggregatePicker';
import ConfigCard from './pivotConfig/controls/ConfigCard';
import OverflowMenu, {
  type OverflowMenuSection,
} from './pivotConfig/controls/OverflowMenu';

const { DndContext, DragOverlay } = DndKitCore;

/**
 * Card-based config UI for the Create Pivot page. State is fully controlled by
 * the parent (`CreatePivotPage`), which maps it onto the model via
 * `applyPivotBuilderConfig`. The Rollup rows, Pivot columns, and Aggregate
 * values cards are wired to the model; the Filterable columns card is still a
 * placeholder (threaded through but not yet applied).
 */

// Mirrors SELECTABLE_OPTIONS in
// web-client-ui/packages/iris-grid/src/sidebar/aggregations/AggregationUtils.ts.
// Inlined because that constant is not re-exported from the package's
// public surface.
const SELECTABLE_OPERATIONS: readonly AggregationOperation[] = [
  AggregationOperation.SUM,
  AggregationOperation.ABS_SUM,
  AggregationOperation.MIN,
  AggregationOperation.MAX,
  AggregationOperation.VAR,
  AggregationOperation.AVG,
  AggregationOperation.MEDIAN,
  AggregationOperation.STD,
  AggregationOperation.FIRST,
  AggregationOperation.LAST,
  AggregationOperation.COUNT_DISTINCT,
  AggregationOperation.DISTINCT,
  AggregationOperation.COUNT,
  AggregationOperation.UNIQUE,
];

export type PivotConfigSectionProps = {
  /** Available source columns. */
  availableColumns: readonly string[];
  /** Names of columns hidden in the host grid. Filtered out of the
   *  Add-column pickers when the "Show hidden columns" overflow option
   *  is off. Already-added entries in the cards are not touched. */
  hiddenColumns?: readonly string[];
  /** Map of column name → column type (e.g. `'java.lang.String'`). Used
   *  to enable/disable columns per aggregation operation. */
  columnTypes: Readonly<Record<string, string>>;

  rollupRows: string[];
  onRollupRowsChange: (next: string[]) => void;
  rollupRowsOn: boolean;
  onRollupRowsOnChange: (next: boolean) => void;
  /** When true, the Rollup rows card is greyed out and the toggle
   *  cannot be flipped on. Used when the host model can't apply rollups. */
  rollupRowsDisabled?: boolean;

  /**
   * Master switch above the cards. When false, every card behaves as
   * if its per-card toggle were off (Switch reads off, body dims,
   * downstream pivot model is not modified) but the cards remain
   * editable so the user can keep arranging columns. The per-card
   * Switches are locked in that mode so their saved positions survive
   * a global-off cycle unchanged.
   */
  globalOn: boolean;
  onGlobalOnChange: (next: boolean) => void;

  pivotColumns: string[];
  onPivotColumnsChange: (next: string[]) => void;
  pivotColumnsOn: boolean;
  onPivotColumnsOnChange: (next: boolean) => void;
  /** When true, the Pivot columns card is greyed out and the toggle
   *  cannot be flipped on. Used when the worker has no PivotService. */
  pivotColumnsDisabled?: boolean;

  aggregationSettings: AggregationSettings;
  onAggregationSettingsChange: (next: AggregationSettings) => void;
  aggregatesOn: boolean;
  onAggregatesOnChange: (next: boolean) => void;

  filterableColumns: string[];
  onFilterableColumnsChange: (next: string[]) => void;
  filterableColumnsOn: boolean;
  onFilterableColumnsOnChange: (next: boolean) => void;

  includeConstituents: boolean;
  onIncludeConstituentsChange: (next: boolean) => void;
  nonAggregatedInRollup: boolean;
  onNonAggregatedInRollupChange: (next: boolean) => void;

  /** Whether an undo step is available. Gates the per-card "Undo" menu item. */
  canUndo: boolean;
  /** Whether a redo step is available. Gates the per-card "Redo" menu item. */
  canRedo: boolean;
  /** Revert the most recent card change. */
  onUndo: () => void;
  /** Reapply the most recently undone card change. */
  onRedo: () => void;
  /**
   * Clear every card (rollup rows, pivot columns, and aggregations) in a
   * single change so the global "Clear all" action is one undo step.
   */
  onClearAll: () => void;
};

export function PivotConfigSection({
  availableColumns,
  hiddenColumns,
  columnTypes,
  rollupRows,
  onRollupRowsChange,
  rollupRowsOn,
  onRollupRowsOnChange,
  rollupRowsDisabled,
  globalOn,
  onGlobalOnChange,
  pivotColumns,
  onPivotColumnsChange,
  pivotColumnsOn,
  onPivotColumnsOnChange,
  pivotColumnsDisabled,
  aggregationSettings,
  onAggregationSettingsChange,
  aggregatesOn,
  onAggregatesOnChange,
  filterableColumns,
  onFilterableColumnsChange,
  filterableColumnsOn,
  onFilterableColumnsOnChange,
  includeConstituents,
  onIncludeConstituentsChange,
  nonAggregatedInRollup,
  onNonAggregatedInRollupChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearAll,
}: PivotConfigSectionProps): JSX.Element {
  const pivotServiceStatus = usePivotServiceStatus();
  const [rollupPickerOpen, setRollupPickerOpen] = useState(false);
  const [pivotPickerOpen, setPivotPickerOpen] = useState(false);
  // `null` = closed. `{ mode: 'add' }` = adding new. `{ mode: 'edit', index }`
  // = editing existing entry.
  const [aggPickerState, setAggPickerState] = useState<
    { mode: 'add' } | { mode: 'edit'; index: number } | null
  >(null);

  // When false (default), the Add-column pickers omit columns the host
  // grid is hiding (via `hiddenColumns`). Card contents are unaffected
  // — an already-added hidden column stays put; the picker just won't
  // re-offer it.
  const [showHiddenColumns, setShowHiddenColumns] = useState(false);

  // Source list for every Add-column picker (Rollup rows, Pivot columns,
  // Aggregate values). When `showHiddenColumns` is on, or the host
  // reports nothing hidden, this is just `availableColumns`; otherwise
  // we drop entries listed in `hiddenColumns`. Order of `availableColumns`
  // is preserved.
  const visibleColumns = useMemo(() => {
    if (
      showHiddenColumns ||
      hiddenColumns == null ||
      hiddenColumns.length === 0
    ) {
      return availableColumns;
    }
    const hidden = new Set(hiddenColumns);
    return availableColumns.filter(c => !hidden.has(c));
  }, [availableColumns, hiddenColumns, showHiddenColumns]);

  // Only one popover (Add picker) may be open at a time across the cards.
  // Opening any Add picker or overflow menu dismisses the others.
  const closeAllPickers = useCallback(() => {
    setRollupPickerOpen(false);
    setPivotPickerOpen(false);
    setAggPickerState(null);
  }, []);

  const handleAddRollupRow = useCallback(() => {
    setPivotPickerOpen(false);
    setAggPickerState(null);
    setRollupPickerOpen(open => !open);
  }, []);

  const handlePickRollupRow = useCallback(
    (name: string) => {
      onRollupRowsChange([...rollupRows, name]);
      setRollupPickerOpen(false);
    },
    [rollupRows, onRollupRowsChange]
  );

  const handleAddPivotColumn = useCallback(() => {
    setRollupPickerOpen(false);
    setAggPickerState(null);
    setPivotPickerOpen(open => !open);
  }, []);

  const handlePickPivotColumn = useCallback(
    (name: string) => {
      onPivotColumnsChange([...pivotColumns, name]);
      setPivotPickerOpen(false);
    },
    [pivotColumns, onPivotColumnsChange]
  );

  const usedOperations = useMemo(
    () => aggregationSettings.aggregations.map(a => a.operation as string),
    [aggregationSettings.aggregations]
  );

  // Map of operation -> selected columns, so the Add picker can show the
  // columns already chosen for whichever function is selected.
  const aggSelectionsByOperation = useMemo<
    Record<string, readonly string[]>
  >(() => {
    const map: Record<string, readonly string[]> = {};
    aggregationSettings.aggregations.forEach(a => {
      map[a.operation as string] = a.selected;
    });
    return map;
  }, [aggregationSettings.aggregations]);

  const selectableOperations = useMemo(
    () =>
      SELECTABLE_OPERATIONS.filter(
        op => !AggregationUtils.isRollupProhibited(op)
      ).map(op => op as string),
    []
  );

  const closeAggPicker = useCallback(() => setAggPickerState(null), []);

  const handleAddAggregate = useCallback(() => {
    setRollupPickerOpen(false);
    setPivotPickerOpen(false);
    setAggPickerState(s => (s?.mode === 'add' ? null : { mode: 'add' }));
  }, []);

  const handleCommitAggregate = useCallback(
    (next: Aggregation) => {
      const aggregations = aggregationSettings.aggregations.slice();
      if (aggPickerState?.mode === 'edit') {
        aggregations[aggPickerState.index] = next;
      } else {
        // Operations are unique per card: if an entry for this function
        // already exists, merge the new columns into it (de-duped, order
        // preserved) instead of pushing a duplicate entry.
        const existingIndex = aggregations.findIndex(
          a => a.operation === next.operation
        );
        if (existingIndex >= 0) {
          const existing = aggregations[existingIndex];
          const selected = [...existing.selected];
          next.selected.forEach(col => {
            if (!selected.includes(col)) {
              selected.push(col);
            }
          });
          aggregations[existingIndex] = { ...existing, selected };
        } else {
          aggregations.push(next);
        }
      }
      onAggregationSettingsChange({ ...aggregationSettings, aggregations });
      setAggPickerState(null);
    },
    [aggPickerState, aggregationSettings, onAggregationSettingsChange]
  );

  const handleChangeAggregateOperation = useCallback(
    (index: number, nextOp: string) => {
      const aggregations = aggregationSettings.aggregations.slice();
      const current = aggregations[index];
      if (current == null || current.operation === nextOp) {
        return;
      }
      // Operations are unique per card. If the target function already has an
      // entry, merge this entry's columns into it (de-duped, order preserved)
      // and drop this row so the two functions collapse into one group.
      const existingIndex = aggregations.findIndex(
        (a, i) => i !== index && a.operation === nextOp
      );
      if (existingIndex >= 0) {
        const existing = aggregations[existingIndex];
        const selected = [...existing.selected];
        current.selected.forEach(col => {
          if (!selected.includes(col)) {
            selected.push(col);
          }
        });
        aggregations[existingIndex] = { ...existing, selected };
        aggregations.splice(index, 1);
      } else {
        aggregations[index] = {
          ...current,
          operation: nextOp as AggregationOperation,
        };
      }
      onAggregationSettingsChange({ ...aggregationSettings, aggregations });
    },
    [aggregationSettings, onAggregationSettingsChange]
  );

  const handleDeleteAggregate = useCallback(
    (index: number) => {
      const aggregations = aggregationSettings.aggregations.filter(
        (_, i) => i !== index
      );
      onAggregationSettingsChange({ ...aggregationSettings, aggregations });
      setAggPickerState(curr => {
        if (curr?.mode !== 'edit') return curr;
        if (curr.index === index) return null;
        return curr.index > index
          ? { mode: 'edit', index: curr.index - 1 }
          : curr;
      });
    },
    [aggregationSettings, onAggregationSettingsChange]
  );

  // Remove a single column from an aggregate function's selection, dropping
  // the whole entry if it was the last column. Keyed by the entry index
  // since each row lists all of a function's columns together.
  const handleDeleteAggregateColumn = useCallback(
    (index: number, column: string) => {
      let aggregations = aggregationSettings.aggregations.map(a => ({
        ...a,
        selected: a.selected.slice(),
      }));
      const entry = aggregations[index];
      if (entry == null) {
        return;
      }
      entry.selected = entry.selected.filter(c => c !== column);
      if (entry.selected.length === 0) {
        aggregations = aggregations.filter((_, i) => i !== index);
      }
      onAggregationSettingsChange({ ...aggregationSettings, aggregations });
    },
    [aggregationSettings, onAggregationSettingsChange]
  );

  // Operations available to a given picker invocation. "Add" always lists
  // every selectable function (including ones already in use); "edit"
  // excludes the operations used by other entries but keeps the current.
  const pickerAvailableOps = useMemo(() => {
    if (aggPickerState == null || aggPickerState.mode === 'add') {
      return selectableOperations;
    }
    const currentOp =
      aggregationSettings.aggregations[aggPickerState.index]?.operation;
    return selectableOperations.filter(
      op => op === currentOp || !usedOperations.includes(op)
    );
  }, [
    aggPickerState,
    aggregationSettings,
    selectableOperations,
    usedOperations,
  ]);

  const pickerInitial = useMemo<Aggregation>(() => {
    if (aggPickerState?.mode === 'edit') {
      const e = aggregationSettings.aggregations[aggPickerState.index];
      if (e != null) return e;
    }
    return {
      operation:
        (pickerAvailableOps[0] as AggregationOperation) ??
        AggregationOperation.SUM,
      selected: [],
      invert: false,
    };
  }, [aggPickerState, aggregationSettings, pickerAvailableOps]);

  const {
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
    collisionDetection,
    dragOverlayPreview,
  } = usePivotDnd({
    rollupRows,
    pivotColumns,
    aggregationSettings,
    columnTypes,
    onRollupRowsChange,
    onPivotColumnsChange,
    onAggregationSettingsChange,
  });

  // Columns already used by either the Rollup rows or Pivot columns card.
  // Excluded from both Add pickers so a column can't be selected twice.
  const usedColumns = useMemo(
    () => [...rollupRows, ...pivotColumns],
    [rollupRows, pivotColumns]
  );

  const pivotActive =
    pivotColumnsOn && pivotColumns.length > 0 && pivotColumnsDisabled !== true;

  // Aggregation-only view: no pivot and no rollup configured. In this mode a
  // function's columns are removable but not draggable — only whole function
  // groups reorder.
  const aggregatesOnly =
    !pivotActive && !(rollupRowsOn && rollupRows.length > 0);

  // Transient undo/redo, surfaced in every card's overflow (⋮) menu just
  // before the Clear items. Shared section + disabled keys so all three
  // menus offer the same actions; the keys are disabled when there is no
  // history to traverse in that direction.
  const undoRedoSection = useMemo<OverflowMenuSection>(
    () => ({
      key: 'undoRedo',
      items: [
        {
          key: 'undo',
          label: 'Undo',
          shortcut: GLOBAL_SHORTCUTS.UNDO.getDisplayText(),
        },
        {
          key: 'redo',
          label: 'Redo',
          shortcut: GLOBAL_SHORTCUTS.REDO.getDisplayText(),
        },
      ],
    }),
    []
  );
  const undoRedoDisabledKeys = useMemo<string[]>(
    () => [...(canUndo ? [] : ['undo']), ...(canRedo ? [] : ['redo'])],
    [canUndo, canRedo]
  );

  // Items for the Rollup card overflow (⋮) menu. Memoized so the Spectrum
  // `Menu` keeps a stable `sections` reference across parent renders. Each
  // section is separated by a divider. "Show hidden columns" and Undo/Redo
  // live only in the global toolbar menu to keep per-card menus focused on
  // card-specific actions.
  const rollupMenuSections = useMemo<OverflowMenuSection[]>(
    () => [
      {
        key: 'rollupToggles',
        items: [
          {
            key: 'includeConstituents',
            label: 'Include constituents in rollup rows',
            isSelected: includeConstituents,
          },
          {
            key: 'nonAggregatedInRollup',
            label: 'Non-aggregated in rollup rows',
            isSelected: nonAggregatedInRollup,
          },
        ],
      },
      {
        key: 'clearAllRollupRows',
        items: [
          {
            key: 'clearAllRollupRows',
            label: 'Clear all rollup rows',
          },
          {
            key: 'clearAll',
            label: 'Clear all',
          },
        ],
      },
    ],
    [includeConstituents, nonAggregatedInRollup]
  );

  const rollupMenuDisabledKeys = useMemo<string[]>(
    () => (pivotActive ? ['includeConstituents', 'nonAggregatedInRollup'] : []),
    [pivotActive]
  );

  // Items for the Aggregate values card overflow (⋮) menu. Shares the
  // "Move totals to top" toggle with no other section; "Show hidden
  // columns" and Undo/Redo live only in the global toolbar menu.
  const aggregateMenuSections = useMemo<OverflowMenuSection[]>(
    () => [
      {
        key: 'moveTotalsToTop',
        items: [
          {
            key: 'moveTotalsToTop',
            label: 'Move totals to top',
            isSelected: aggregationSettings.showOnTop,
          },
        ],
      },
      {
        key: 'clearAllAggregations',
        items: [
          {
            key: 'clearAllAggregations',
            label: 'Clear all aggregations',
          },
          {
            key: 'clearAll',
            label: 'Clear all',
          },
        ],
      },
    ],
    [aggregationSettings.showOnTop]
  );

  // Disable "Move totals to top" when not in aggregation-only mode — i.e.
  // whenever a pivot or rollup is configured.
  const aggregateMenuDisabledKeys = useMemo<string[]>(
    () =>
      pivotActive || (rollupRowsOn && rollupRows.length > 0)
        ? ['moveTotalsToTop']
        : [],
    [pivotActive, rollupRowsOn, rollupRows]
  );

  // Items for the global toolbar overflow (⋮) menu above the cards.
  // Mirrors the per-card menus' structure (show hidden columns → undo/redo
  // → clear all) so toolbar and card menus look consistent.
  const globalMenuSections = useMemo<OverflowMenuSection[]>(
    () => [
      {
        key: 'showHiddenColumns',
        items: [
          {
            key: 'showHiddenColumns',
            label: 'Show hidden columns in menu',
            isSelected: showHiddenColumns,
          },
        ],
      },
      undoRedoSection,
      {
        key: 'clearAll',
        items: [
          {
            key: 'clearAll',
            label: 'Clear all',
          },
        ],
      },
    ],
    [showHiddenColumns, undoRedoSection]
  );

  // Items for the Pivot columns card overflow (⋮) menu. "Show hidden
  // columns" and Undo/Redo live only in the global toolbar menu.
  const pivotMenuSections = useMemo<OverflowMenuSection[]>(
    () => [
      {
        key: 'clearAllPivotColumns',
        items: [
          {
            key: 'clearAllPivotColumns',
            label: 'Clear all pivot columns',
          },
          {
            key: 'clearAll',
            label: 'Clear all',
          },
        ],
      },
    ],
    []
  );

  const handleConfigMenuAction = useCallback(
    (key: string) => {
      if (key === 'undo') {
        onUndo();
      } else if (key === 'redo') {
        onRedo();
      } else if (key === 'includeConstituents') {
        onIncludeConstituentsChange(!includeConstituents);
      } else if (key === 'nonAggregatedInRollup') {
        onNonAggregatedInRollupChange(!nonAggregatedInRollup);
      } else if (key === 'moveTotalsToTop') {
        onAggregationSettingsChange({
          ...aggregationSettings,
          showOnTop: !aggregationSettings.showOnTop,
        });
      } else if (key === 'showHiddenColumns') {
        setShowHiddenColumns(prev => !prev);
      } else if (key === 'clearAllAggregations') {
        onAggregationSettingsChange({
          ...aggregationSettings,
          aggregations: [],
        });
      } else if (key === 'clearAllRollupRows') {
        onRollupRowsChange([]);
      } else if (key === 'clearAllPivotColumns') {
        onPivotColumnsChange([]);
      } else if (key === 'clearAll') {
        onClearAll();
      }
    },
    [
      includeConstituents,
      nonAggregatedInRollup,
      aggregationSettings,
      onIncludeConstituentsChange,
      onNonAggregatedInRollupChange,
      onAggregationSettingsChange,
      onRollupRowsChange,
      onPivotColumnsChange,
      onUndo,
      onRedo,
      onClearAll,
    ]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className={`pivot-config-section${
          dragSource != null ? ' is-dragging' : ''
        }${
          dragSource === ROLLUP_ROWS_DROPPABLE ||
          dragSource === PIVOT_COLUMNS_DROPPABLE
            ? ' is-dragging-columns'
            : ''
        }${
          dragSource === AGGREGATIONS_DROPPABLE
            ? ' is-dragging-aggregations'
            : ''
        }${dropInvalid ? ' is-drop-invalid' : ''}`}
      >
        <div className="pivot-toolbar">
          <span>Enable</span>
          <Switch
            isSelected={globalOn}
            onChange={next => {
              if (next !== globalOn) {
                onGlobalOnChange(next);
              }
            }}
            aria-label="Enable"
            margin={0}
          />
          <div className="pivot-spacer" />
          <Button
            kind="ghost"
            icon={vsDiscard}
            tooltip={`Undo (${GLOBAL_SHORTCUTS.UNDO.getDisplayText()})`}
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
            className="px-1"
          />
          <Button
            kind="ghost"
            icon={vsRedo}
            tooltip={`Redo (${GLOBAL_SHORTCUTS.REDO.getDisplayText()})`}
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
            className="px-1"
          />
          <OverflowMenu
            sections={globalMenuSections}
            disabledKeys={undoRedoDisabledKeys}
            tooltip="Pivot builder options"
            onAction={handleConfigMenuAction}
            onOpen={closeAllPickers}
          />
        </div>
        {/* The `picker` props below are intentional render props (they need
          the card's anchor ref); they are not unstable nested components. */}
        {/* eslint-disable react/no-unstable-nested-components */}
        <ConfigCard
          title="Rollup rows"
          on={rollupRowsOn && rollupRowsDisabled !== true && globalOn}
          onToggle={onRollupRowsOnChange}
          onAdd={handleAddRollupRow}
          disabled={rollupRowsDisabled === true}
          toggleLocked={!globalOn}
          hasBody={rollupRows.length > 0}
          overflow={
            <OverflowMenu
              sections={rollupMenuSections}
              disabledKeys={rollupMenuDisabledKeys}
              tooltip="Rollup options"
              onAction={handleConfigMenuAction}
              onOpen={closeAllPickers}
            />
          }
          picker={anchorRef =>
            rollupPickerOpen ? (
              <ColumnPicker
                anchorRef={anchorRef}
                available={visibleColumns}
                excluded={usedColumns}
                onPick={handlePickRollupRow}
                onClose={() => setRollupPickerOpen(false)}
              />
            ) : null
          }
        >
          <DroppableList
            id={ROLLUP_ROWS_DROPPABLE}
            type="columns"
            itemIds={rollupColumnIds}
            isEmpty={rollupColumnIds.length === 0}
            disabled={rollupRowsDisabled === true}
          >
            {rollupColumnIds.map(id => {
              const name = columnNameFromItemId(id) ?? id;
              return (
                <ColumnRow
                  key={id}
                  id={id}
                  name={name}
                  container={ROLLUP_ROWS_DROPPABLE}
                  onDelete={() =>
                    onRollupRowsChange(rollupRows.filter(n => n !== name))
                  }
                />
              );
            })}
          </DroppableList>
        </ConfigCard>

        <ConfigCard
          title="Pivot columns"
          on={pivotColumnsOn && pivotColumnsDisabled !== true && globalOn}
          onToggle={onPivotColumnsOnChange}
          onAdd={handleAddPivotColumn}
          addDisabled={false}
          disabled={pivotColumnsDisabled === true}
          toggleLocked={!globalOn}
          hasBody={
            pivotColumns.length > 0 ||
            (pivotColumnsDisabled === true &&
              pivotServiceStatus === 'unavailable')
          }
          overflow={
            <OverflowMenu
              sections={pivotMenuSections}
              tooltip="Pivot options"
              onAction={handleConfigMenuAction}
              onOpen={closeAllPickers}
            />
          }
          picker={anchorRef =>
            pivotPickerOpen ? (
              <ColumnPicker
                anchorRef={anchorRef}
                available={visibleColumns}
                excluded={usedColumns}
                onPick={handlePickPivotColumn}
                onClose={() => setPivotPickerOpen(false)}
              />
            ) : null
          }
        >
          {pivotColumnsDisabled === true &&
          pivotServiceStatus === 'unavailable' ? (
            <ServiceUnavailableMessage />
          ) : (
            <DroppableList
              id={PIVOT_COLUMNS_DROPPABLE}
              type="columns"
              itemIds={pivotColumnIds}
              isEmpty={pivotColumnIds.length === 0}
              disabled={pivotColumnsDisabled === true}
            >
              {pivotColumnIds.map(id => {
                const name = columnNameFromItemId(id) ?? id;
                return (
                  <ColumnRow
                    key={id}
                    id={id}
                    name={name}
                    container={PIVOT_COLUMNS_DROPPABLE}
                    onDelete={() =>
                      onPivotColumnsChange(pivotColumns.filter(n => n !== name))
                    }
                  />
                );
              })}
            </DroppableList>
          )}
        </ConfigCard>

        <ConfigCard
          title="Aggregate values"
          on={aggregatesOn && globalOn}
          onToggle={onAggregatesOnChange}
          onAdd={handleAddAggregate}
          toggleLocked={!globalOn}
          hasBody={aggregationSettings.aggregations.length > 0}
          overflow={
            <OverflowMenu
              sections={aggregateMenuSections}
              tooltip="Aggregate options"
              onAction={handleConfigMenuAction}
              onOpen={closeAllPickers}
              disabledKeys={aggregateMenuDisabledKeys}
            />
          }
          picker={anchorRef =>
            aggPickerState != null ? (
              <AggregatePicker
                anchorRef={anchorRef}
                availableColumns={visibleColumns}
                columnTypes={columnTypes}
                availableOperations={pickerAvailableOps}
                initial={pickerInitial}
                existingSelections={aggSelectionsByOperation}
                onCommit={handleCommitAggregate}
                onClose={closeAggPicker}
              />
            ) : null
          }
        >
          <DroppableList
            id={AGGREGATIONS_DROPPABLE}
            type="aggregations"
            itemIds={aggItemIds}
            isEmpty={aggregationSettings.aggregations.length === 0}
          >
            {aggregationSettings.aggregations.map((entry, i) => {
              const op = entry.operation as string;
              return (
                <AggregateSelectRow
                  key={aggregationRowId(op)}
                  id={aggregationRowId(op)}
                  operation={entry.operation}
                  columnLabels={entry.selected}
                  availableOperations={selectableOperations}
                  columnTypes={columnTypes}
                  onOperationChange={o => handleChangeAggregateOperation(i, o)}
                  onDelete={() => handleDeleteAggregate(i)}
                  onDeleteColumn={column =>
                    handleDeleteAggregateColumn(i, column)
                  }
                  columnsDraggable={!aggregatesOnly}
                  collapsed={isDraggingAggregationGroup}
                  // Preview-aware column items so a cross-group drag animates
                  // via the nested SortableContext. Index-aligned with the
                  // committed aggregations.
                  columnItems={aggColumnGroups[i]?.columnItems}
                />
              );
            })}
          </DroppableList>
        </ConfigCard>

        {/* Filterable columns card hidden for now \u2014 props are still threaded
          through so it can be re-enabled without churn. */}
        {/* eslint-enable react/no-unstable-nested-components */}
      </div>
      {createPortal(
        // Aggregations can't be interleaved across operations (the pivot
        // payload groups columns by operation), so a cross-operation drop
        // regroups the dragged row back into its own operation. Keep dnd-kit's
        // default drop animation for aggregation drags so that snap-back is
        // visible; column drags use the Organize Columns fade so the overlay
        // dissolves as the ghosted source row fades back in.
        <DragOverlay
          style={DRAG_OVERLAY_STYLE}
          modifiers={[pinOverlayToCursor]}
          dropAnimation={
            activeContainerRef.current === AGGREGATIONS_DROPPABLE
              ? undefined
              : COLUMN_DROP_ANIMATION
          }
        >
          {dragOverlayPreview}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default PivotConfigSection;
