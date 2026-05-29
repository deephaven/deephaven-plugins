import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  Checkbox,
  SearchInput,
  Select,
  UISwitch,
} from '@deephaven/components';
import { vsEdit, vsGripper, vsTrash } from '@deephaven/icons';
import {
  AggregationOperation,
  AggregationUtils,
  type Aggregation,
  type AggregationSettings,
} from '@deephaven/iris-grid';

/**
 * Mock-data UI section that previews the eventual replacement for the
 * Rollups & Aggregations sidebar. State is fully controlled by the parent.
 * The Rollup rows and Aggregate values cards are wired to the model
 * (in CreatePivotPage); pivot/filter cards are still mock-only.
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
  /** Map of column name → column type (e.g. `'java.lang.String'`). Used
   *  to enable/disable columns per aggregation operation. */
  columnTypes: Readonly<Record<string, string>>;

  rollupRows: string[];
  onRollupRowsChange: (next: string[]) => void;
  rollupRowsOn: boolean;
  onRollupRowsOnChange: (next: boolean) => void;

  pivotColumns: string[];
  onPivotColumnsChange: (next: string[]) => void;
  pivotColumnsOn: boolean;
  onPivotColumnsOnChange: (next: boolean) => void;

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
};

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--dh-color-border-base, #444)',
  borderRadius: 4,
  padding: '8px 10px',
  background: 'var(--dh-color-bg-200, transparent)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 6,
};

const cardTitleStyle: React.CSSProperties = {
  flex: 1,
  fontWeight: 600,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 2px',
};

const rowLabelStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const emptyStyle: React.CSSProperties = {
  opacity: 0.6,
  fontStyle: 'italic',
  padding: '4px 2px',
};

const disabledBodyStyle: React.CSSProperties = {
  opacity: 0.4,
  pointerEvents: 'none',
  userSelect: 'none',
};

const popoverStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1000,
  top: 'calc(100% + 4px)',
  right: 0,
  width: 240,
  maxHeight: 320,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--dh-color-bg-200, #1f1f1f)',
  border: '1px solid var(--dh-color-border-base, #444)',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
};

const popoverSearchStyle: React.CSSProperties = {
  padding: 8,
};

const popoverListStyle: React.CSSProperties = {
  overflowY: 'auto',
  flex: 1,
};

const popoverItemStyle: React.CSSProperties = {
  padding: '6px 12px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const popoverEmptyStyle: React.CSSProperties = {
  padding: '8px 12px',
  opacity: 0.6,
  fontStyle: 'italic',
};

type PickerProps = {
  anchorRef: React.RefObject<HTMLElement>;
  available: readonly string[];
  excluded: readonly string[];
  placeholder?: string;
  onPick: (name: string) => void;
  onClose: () => void;
};

/**
 * Position a fixed-position popover so its top-right corner is anchored
 * just below the anchor element. Flips above the anchor when the
 * preferred placement would fall off the bottom of the viewport.
 */
function usePortalAnchorPosition(
  anchorRef: React.RefObject<HTMLElement>,
  popoverRef: React.RefObject<HTMLElement>
): { top: number; right: number } | null {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  useLayoutEffect(() => {
    const a = anchorRef.current;
    const p = popoverRef.current;
    if (a == null) return undefined;
    const compute = (): void => {
      const r = a.getBoundingClientRect();
      const ph = p?.getBoundingClientRect().height ?? 0;
      const gap = 4;
      const wantTop = r.bottom + gap;
      const overflowsBottom = wantTop + ph > window.innerHeight - 8;
      const top = overflowsBottom ? Math.max(8, r.top - gap - ph) : wantTop;
      const right = window.innerWidth - r.right;
      setPos({ top, right });
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [anchorRef, popoverRef]);
  return pos;
}

function ColumnPicker({
  anchorRef,
  available,
  excluded,
  placeholder = 'Find column...',
  onPick,
  onClose,
}: PickerProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<SearchInput>(null);
  const excludedSet = useMemo(() => new Set(excluded), [excluded]);
  const pos = usePortalAnchorPosition(anchorRef, containerRef);

  useEffect(() => {
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter(
      c => !excludedSet.has(c) && (q === '' || c.toLowerCase().includes(q))
    );
  }, [available, excludedSet, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, filtered.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        containerRef.current != null &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = filtered[activeIndex];
        if (pick != null) onPick(pick);
      }
    },
    [activeIndex, filtered, onPick]
  );

  return createPortal(
    <div
      ref={containerRef}
      style={{
        ...popoverStyle,
        position: 'fixed',
        top: pos?.top ?? -9999,
        right: pos?.right ?? 0,
        visibility: pos == null ? 'hidden' : 'visible',
      }}
      role="dialog"
    >
      <div style={popoverSearchStyle}>
        <SearchInput
          ref={searchRef}
          value={query}
          placeholder={placeholder}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div style={popoverListStyle} role="listbox">
        {filtered.length === 0 ? (
          <div style={popoverEmptyStyle}>No options</div>
        ) : (
          filtered.map((name, i) => (
            // eslint-disable-next-line jsx-a11y/interactive-supports-focus
            <div
              key={name}
              role="option"
              aria-selected={i === activeIndex}
              style={{
                ...popoverItemStyle,
                background:
                  i === activeIndex
                    ? 'var(--dh-color-bg-300, #333)'
                    : 'transparent',
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={e => {
                e.preventDefault();
                onPick(name);
              }}
            >
              {name}
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

type ConfigCardProps = {
  title: string;
  on: boolean;
  onToggle: (next: boolean) => void;
  onAdd: () => void;
  addDisabled?: boolean;
  /** When true, the whole card is greyed-out and non-interactive. */
  disabled?: boolean;
  picker?: (anchorRef: React.RefObject<HTMLElement>) => React.ReactNode;
  children: React.ReactNode;
};

function ConfigCard({
  title,
  on,
  onToggle,
  onAdd,
  addDisabled,
  disabled,
  picker,
  children,
}: ConfigCardProps): JSX.Element {
  const buttonRef = useRef<HTMLSpanElement>(null);
  return (
    <div
      style={
        disabled === true
          ? { ...cardStyle, opacity: 0.5, pointerEvents: 'none' }
          : cardStyle
      }
      aria-disabled={disabled === true}
    >
      <div style={cardHeaderStyle}>
        <span style={cardTitleStyle}>{title}</span>
        <UISwitch on={on} onClick={() => onToggle(!on)} />
        <Button
          ref={buttonRef}
          kind="tertiary"
          onClick={onAdd}
          disabled={!on || addDisabled === true || disabled === true}
        >
          Add
        </Button>
        {picker?.(buttonRef)}
      </div>
      <div style={on ? undefined : disabledBodyStyle} aria-disabled={!on}>
        {children}
      </div>
    </div>
  );
}

/**
 * Returns the props needed to make a row draggable for reordering, but only
 * when the drag is initiated from the grip handle. Drag scope is limited to
 * the given `groupKey` so rows in different cards don't cross-reorder.
 */
function useDraggableRow(
  groupKey: string,
  index: number,
  onReorder: (from: number, to: number) => void
): {
  draggable: boolean;
  isDragOver: boolean;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onDragEnd: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onDragLeave: React.DragEventHandler<HTMLDivElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onGripMouseDown: () => void;
  onGripMouseUp: () => void;
} {
  const [draggable, setDraggable] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const mime = `application/x-pivot-row+${groupKey}`;
  return {
    draggable,
    isDragOver,
    onDragStart: e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData(mime, String(index));
    },
    onDragEnd: () => {
      setDraggable(false);
      setIsDragOver(false);
    },
    onDragOver: e => {
      if (e.dataTransfer.types.includes(mime)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }
    },
    onDragLeave: () => setIsDragOver(false),
    onDrop: e => {
      const raw = e.dataTransfer.getData(mime);
      setIsDragOver(false);
      if (raw === '') return;
      const from = Number(raw);
      if (!Number.isFinite(from) || from === index) return;
      e.preventDefault();
      onReorder(from, index);
    },
    onGripMouseDown: () => setDraggable(true),
    onGripMouseUp: () => setDraggable(false),
  };
}

const dragOverRowStyle: React.CSSProperties = {
  boxShadow: 'inset 0 2px 0 0 var(--dh-color-accent, #4a90e2)',
};
const gripStyle: React.CSSProperties = { cursor: 'grab' };

type ColumnRowProps = {
  name: string;
  index: number;
  groupKey: string;
  onReorder: (from: number, to: number) => void;
  onDelete: () => void;
};

function ColumnRow({
  name,
  index,
  groupKey,
  onReorder,
  onDelete,
}: ColumnRowProps): JSX.Element {
  const d = useDraggableRow(groupKey, index, onReorder);
  return (
    <div
      draggable={d.draggable}
      onDragStart={d.onDragStart}
      onDragEnd={d.onDragEnd}
      onDragOver={d.onDragOver}
      onDragLeave={d.onDragLeave}
      onDrop={d.onDrop}
      style={d.isDragOver ? { ...rowStyle, ...dragOverRowStyle } : rowStyle}
    >
      <span style={rowLabelStyle}>{name}</span>
      <Button
        kind="ghost"
        icon={vsGripper}
        tooltip="Drag to reorder"
        onClick={() => undefined}
        style={gripStyle}
        onMouseDown={d.onGripMouseDown}
        onMouseUp={d.onGripMouseUp}
      />
      <Button kind="ghost" icon={vsTrash} tooltip="Remove" onClick={onDelete} />
    </div>
  );
}

type AggregateRowProps = {
  entry: Aggregation;
  index: number;
  groupKey: string;
  onReorder: (from: number, to: number) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function AggregateRow({
  entry,
  index,
  groupKey,
  onReorder,
  onEdit,
  onDelete,
}: AggregateRowProps): JSX.Element {
  const d = useDraggableRow(groupKey, index, onReorder);
  const label =
    entry.selected.length > 0
      ? `${entry.operation} (${entry.selected.join(', ')})`
      : entry.operation;
  return (
    <div
      draggable={d.draggable}
      onDragStart={d.onDragStart}
      onDragEnd={d.onDragEnd}
      onDragOver={d.onDragOver}
      onDragLeave={d.onDragLeave}
      onDrop={d.onDrop}
      style={d.isDragOver ? { ...rowStyle, ...dragOverRowStyle } : rowStyle}
    >
      <span style={rowLabelStyle}>{label}</span>
      <Button kind="ghost" icon={vsEdit} tooltip="Edit" onClick={onEdit} />
      <Button
        kind="ghost"
        icon={vsGripper}
        tooltip="Drag to reorder"
        onClick={() => undefined}
        style={gripStyle}
        onMouseDown={d.onGripMouseDown}
        onMouseUp={d.onGripMouseUp}
      />
      <Button kind="ghost" icon={vsTrash} tooltip="Remove" onClick={onDelete} />
    </div>
  );
}

const aggregatePopoverStyle: React.CSSProperties = {
  ...popoverStyle,
  width: 280,
  maxHeight: 'min(420px, calc(100vh - 32px))',
  padding: 12,
  gap: 8,
};

const aggregateFieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  marginBottom: 4,
};

const aggregateColumnListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  border: '1px solid var(--dh-color-border-base, #444)',
  borderRadius: 4,
  padding: '4px 8px',
  minHeight: 120,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const aggregateFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 4,
  flexShrink: 0,
};

type AggregatePickerProps = {
  anchorRef: React.RefObject<HTMLElement>;
  availableColumns: readonly string[];
  columnTypes: Readonly<Record<string, string>>;
  availableOperations: readonly string[];
  initial: Aggregation;
  onCommit: (next: Aggregation) => void;
  onClose: () => void;
};

function AggregatePicker({
  anchorRef,
  availableColumns,
  columnTypes,
  availableOperations,
  initial,
  onCommit,
  onClose,
}: AggregatePickerProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const [operation, setOperation] = useState<string>(initial.operation);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial.selected)
  );
  const [query, setQuery] = useState('');
  const pos = usePortalAnchorPosition(anchorRef, containerRef);

  useEffect(() => {
    // Defer focus past portal mount + position so the browser actually
    // gives the (visible) <select> focus.
    const id = requestAnimationFrame(() => selectRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const isColumnValid = useCallback(
    (name: string): boolean => {
      const t = columnTypes[name];
      if (t == null) return true;
      return AggregationUtils.isValidOperation(
        operation as AggregationOperation,
        t
      );
    },
    [columnTypes, operation]
  );

  // Drop any selections that aren't valid for the current operation.
  useEffect(() => {
    setSelected(prev => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach(name => {
        if (isColumnValid(name)) next.add(name);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [isColumnValid]);

  const filteredColumns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === ''
      ? availableColumns
      : availableColumns.filter(c => c.toLowerCase().includes(q));
  }, [availableColumns, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        containerRef.current != null &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const toggleColumn = useCallback(
    (name: string) => {
      if (!isColumnValid(name)) return;
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
      });
    },
    [isColumnValid]
  );

  const handleSelectAll = useCallback(() => {
    setSelected(prev => {
      const next = new Set(prev);
      filteredColumns.forEach(c => {
        if (isColumnValid(c)) next.add(c);
      });
      return next;
    });
  }, [filteredColumns, isColumnValid]);

  const handleClear = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleCommit = useCallback(() => {
    onCommit({
      operation: operation as AggregationOperation,
      // Preserve order of availableColumns for stable output.
      selected: availableColumns.filter(c => selected.has(c)),
      invert: false,
    });
  }, [operation, selected, availableColumns, onCommit]);

  return createPortal(
    <div
      ref={containerRef}
      style={{
        ...aggregatePopoverStyle,
        position: 'fixed',
        top: pos?.top ?? -9999,
        right: pos?.right ?? 0,
        visibility: pos == null ? 'hidden' : 'visible',
      }}
      role="dialog"
    >
      <div>
        <div style={aggregateFieldLabelStyle}>Select aggregation</div>
        <Select
          ref={selectRef}
          value={operation}
          onChange={value => setOperation(value)}
          className="custom-select-box form-control"
        >
          {availableOperations.map(op => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </Select>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flex: 1,
          // Allow this flex child to shrink below its content size so
          // the inner column list's `overflowY: auto` kicks in and the
          // footer stays inside the popover's bounded maxHeight.
          minHeight: 0,
        }}
      >
        <div style={aggregateFieldLabelStyle}>
          Select column(s)
          <span style={{ color: 'var(--dh-color-negative, #f55)' }}>*</span>
        </div>
        <SearchInput
          value={query}
          placeholder="Find column..."
          onChange={e => setQuery(e.target.value)}
        />
        <div style={aggregateColumnListStyle}>
          {filteredColumns.length === 0 ? (
            <div style={popoverEmptyStyle}>No columns</div>
          ) : (
            filteredColumns.map(name => {
              const valid = isColumnValid(name);
              return (
                <Checkbox
                  key={name}
                  checked={selected.has(name)}
                  disabled={!valid}
                  onChange={() => toggleColumn(name)}
                >
                  {name}
                </Checkbox>
              );
            })
          )}
        </div>
      </div>
      <div style={aggregateFooterStyle}>
        <Button kind="ghost" onClick={handleSelectAll}>
          Select All
        </Button>
        <Button kind="ghost" onClick={handleClear}>
          Clear
        </Button>
        <span style={{ flex: 1 }} />
        <Button
          kind="primary"
          onClick={handleCommit}
          disabled={selected.size === 0}
        >
          Aggregate
        </Button>
      </div>
    </div>,
    document.body
  );
}

export function PivotConfigSection({
  availableColumns,
  columnTypes,
  rollupRows,
  onRollupRowsChange,
  rollupRowsOn,
  onRollupRowsOnChange,
  pivotColumns,
  onPivotColumnsChange,
  pivotColumnsOn,
  onPivotColumnsOnChange,
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
}: PivotConfigSectionProps): JSX.Element {
  const [rollupPickerOpen, setRollupPickerOpen] = useState(false);
  const [pivotPickerOpen, setPivotPickerOpen] = useState(false);
  // `null` = closed. `{ mode: 'add' }` = adding new. `{ mode: 'edit', index }`
  // = editing existing entry.
  const [aggPickerState, setAggPickerState] = useState<
    { mode: 'add' } | { mode: 'edit'; index: number } | null
  >(null);

  const handleAddRollupRow = useCallback(() => {
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

  const hasAggregateSelections = useMemo(
    () =>
      aggregatesOn &&
      aggregationSettings.aggregations.some(a => a.selected.length > 0),
    [aggregatesOn, aggregationSettings.aggregations]
  );

  const selectableOperations = useMemo(
    () =>
      SELECTABLE_OPERATIONS.filter(
        op => !AggregationUtils.isRollupProhibited(op)
      ).map(op => op as string),
    []
  );

  const closeAggPicker = useCallback(() => setAggPickerState(null), []);

  const handleAddAggregate = useCallback(() => {
    setAggPickerState(s => (s?.mode === 'add' ? null : { mode: 'add' }));
  }, []);

  const handleEditAggregate = useCallback((index: number) => {
    setAggPickerState(s =>
      s?.mode === 'edit' && s.index === index ? null : { mode: 'edit', index }
    );
  }, []);

  const handleCommitAggregate = useCallback(
    (next: Aggregation) => {
      const aggregations = aggregationSettings.aggregations.slice();
      if (aggPickerState?.mode === 'edit') {
        aggregations[aggPickerState.index] = next;
      } else {
        aggregations.push(next);
      }
      onAggregationSettingsChange({ ...aggregationSettings, aggregations });
      setAggPickerState(null);
    },
    [aggPickerState, aggregationSettings, onAggregationSettingsChange]
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

  // Operations available to a given picker invocation. For "add" we exclude
  // every already-used op; for "edit" we exclude others but keep the current.
  const pickerAvailableOps = useMemo(() => {
    if (aggPickerState == null) return selectableOperations;
    const currentOp =
      aggPickerState.mode === 'edit'
        ? aggregationSettings.aggregations[aggPickerState.index]?.operation
        : undefined;
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

  const removeAt = <T,>(arr: T[], index: number): T[] => {
    const next = arr.slice();
    next.splice(index, 1);
    return next;
  };

  const moveItem = <T,>(arr: readonly T[], from: number, to: number): T[] => {
    const next = arr.slice();
    if (from === to) return next;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ConfigCard
        title="Rollup rows"
        on={rollupRowsOn}
        onToggle={onRollupRowsOnChange}
        onAdd={handleAddRollupRow}
        picker={anchorRef =>
          rollupPickerOpen ? (
            <ColumnPicker
              anchorRef={anchorRef}
              available={availableColumns}
              excluded={rollupRows}
              onPick={handlePickRollupRow}
              onClose={() => setRollupPickerOpen(false)}
            />
          ) : null
        }
      >
        {rollupRows.length === 0 ? (
          <div style={emptyStyle}>No columns</div>
        ) : (
          rollupRows.map((name, i) => (
            <ColumnRow
              // eslint-disable-next-line react/no-array-index-key
              key={`${name}-${i}`}
              name={name}
              index={i}
              groupKey="rollup-rows"
              onReorder={(from, to) =>
                onRollupRowsChange(moveItem(rollupRows, from, to))
              }
              onDelete={() => onRollupRowsChange(removeAt(rollupRows, i))}
            />
          ))
        )}
      </ConfigCard>

      <ConfigCard
        title="Pivot columns"
        on={pivotColumnsOn}
        onToggle={onPivotColumnsOnChange}
        onAdd={handleAddPivotColumn}
        addDisabled={rollupRows.length === 0 || !hasAggregateSelections}
        picker={anchorRef =>
          pivotPickerOpen ? (
            <ColumnPicker
              anchorRef={anchorRef}
              available={availableColumns}
              excluded={pivotColumns}
              onPick={handlePickPivotColumn}
              onClose={() => setPivotPickerOpen(false)}
            />
          ) : null
        }
      >
        {(() => {
          if (pivotColumnsOn && rollupRows.length === 0) {
            return <div style={emptyStyle}>Add at least one Rollup row</div>;
          }
          if (pivotColumnsOn && !hasAggregateSelections) {
            return (
              <div style={emptyStyle}>Add at least one Aggregate value</div>
            );
          }
          if (pivotColumns.length === 0) {
            return <div style={emptyStyle}>No columns</div>;
          }
          return pivotColumns.map((name, i) => (
            <ColumnRow
              // eslint-disable-next-line react/no-array-index-key
              key={`${name}-${i}`}
              name={name}
              index={i}
              groupKey="pivot-columns"
              onReorder={(from, to) =>
                onPivotColumnsChange(moveItem(pivotColumns, from, to))
              }
              onDelete={() => onPivotColumnsChange(removeAt(pivotColumns, i))}
            />
          ));
        })()}
      </ConfigCard>

      <ConfigCard
        title="Aggregate values"
        on={aggregatesOn}
        onToggle={onAggregatesOnChange}
        onAdd={handleAddAggregate}
        addDisabled={usedOperations.length >= selectableOperations.length}
        picker={anchorRef =>
          aggPickerState != null ? (
            <AggregatePicker
              anchorRef={anchorRef}
              availableColumns={availableColumns}
              columnTypes={columnTypes}
              availableOperations={pickerAvailableOps}
              initial={pickerInitial}
              onCommit={handleCommitAggregate}
              onClose={closeAggPicker}
            />
          ) : null
        }
      >
        {aggregationSettings.aggregations.length === 0 ? (
          <div style={emptyStyle}>No aggregates</div>
        ) : (
          aggregationSettings.aggregations.map((entry, i) => (
            <AggregateRow
              // eslint-disable-next-line react/no-array-index-key
              key={`${entry.operation}-${i}`}
              entry={entry}
              index={i}
              groupKey="aggregations"
              onReorder={(from, to) =>
                onAggregationSettingsChange({
                  ...aggregationSettings,
                  aggregations: moveItem(
                    aggregationSettings.aggregations,
                    from,
                    to
                  ),
                })
              }
              onEdit={() => handleEditAggregate(i)}
              onDelete={() => handleDeleteAggregate(i)}
            />
          ))
        )}
      </ConfigCard>

      {/* Filterable columns card hidden for now \u2014 props are still threaded
          through so it can be re-enabled without churn. */}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Checkbox
          checked={includeConstituents}
          onChange={e => onIncludeConstituentsChange(e.target.checked)}
        >
          Include constituents in rollups rows
        </Checkbox>
        <Checkbox
          checked={nonAggregatedInRollup}
          onChange={e => onNonAggregatedInRollupChange(e.target.checked)}
        >
          Non-aggregated in rollup rows
        </Checkbox>
      </div>
    </div>
  );
}

export default PivotConfigSection;
