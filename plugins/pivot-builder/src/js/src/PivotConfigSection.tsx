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
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionButton,
  Button,
  Checkbox,
  SearchInput,
  Select,
  Switch,
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
// Marching-ants drop-zone styling, mirroring the `ants-base` mixin used by
// iris-grid's RollupRows.scss. Injected as a <style> tag so the plugin
// bundle stays a single JS file (no separate CSS asset). The `march`
// keyframes are already defined globally by the host's @deephaven/components
// BaseStyleSheet, so we only emit the layered backgrounds + animation.
const PIVOT_DND_STYLES = `
.pivot-config-section .pivot-droppable {
  min-height: 4px;
  border-radius: 2px;
  transition: background-color 0.15s ease;
}
.pivot-config-section .pivot-droppable-empty {
  min-height: 36px;
  margin: 4px 0;
  padding: 4px;
  border: dashed 1px transparent;
  border-radius: 2px;
}
/* Marching-ants on every active drop zone whose accepted source type
 * matches the current drag. is-dragging-columns is set on the root
 * while a column row (rollup/pivot) is being dragged;
 * is-dragging-aggregations while an aggregation is being dragged. */
.pivot-config-section.is-dragging-columns .pivot-droppable-columns,
.pivot-config-section.is-dragging-aggregations .pivot-droppable-aggregations {
  background-image:
    linear-gradient(to right, var(--dh-color-bg-200, #1a1a1a) 50%, var(--dh-color-fg, #f0f0ee) 50%),
    linear-gradient(to right, var(--dh-color-bg-200, #1a1a1a) 50%, var(--dh-color-fg, #f0f0ee) 50%),
    linear-gradient(to bottom, var(--dh-color-bg-200, #1a1a1a) 50%, var(--dh-color-fg, #f0f0ee) 50%),
    linear-gradient(to bottom, var(--dh-color-bg-200, #1a1a1a) 50%, var(--dh-color-fg, #f0f0ee) 50%);
  background-size: 8px 1px, 8px 1px, 1px 8px, 1px 8px;
  background-position: 0 top, 0 bottom, left 0, right 0;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  animation: march 0.5s linear infinite;
}
.pivot-config-section .pivot-droppable.is-dragging-over,
.pivot-config-section .pivot-droppable-empty.is-dragging-over {
  background-color: var(--dh-color-item-list-selected-hover-bg, rgba(255, 255, 255, 0.08));
}
`;

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

// Style applied to a row while it is being dragged. Mirrors iris-grid's
// `.draggable-item-list-dragging-item .item-list-item-content` rule:
// primary-colored chip with shadow and contrast text.
const draggingRowStyle: React.CSSProperties = {
  backgroundColor: 'var(--dh-color-accent, #4878ea)',
  color: 'var(--dh-color-accent-contrast, #fff)',
  boxShadow: 'var(--dh-shadow-base, 0 2px 6px rgba(0, 0, 0, 0.4))',
  borderRadius: 4,
  padding: '4px 8px',
};

const gripHandleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'grab',
  padding: '0 4px',
  color: 'var(--dh-color-fg-200, #888)',
};

/** Inline SVG icon to avoid bundling `@fortawesome/react-fontawesome`
 *  (which is not in the host's remote-component resolve map). */
function GripIcon(): JSX.Element {
  // vsGripper.icon = [width, height, _ligs, _unicode, svgPathData]
  const [w, h, , , path] = vsGripper.icon as [
    number,
    number,
    string[],
    string,
    string,
  ];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${w} ${h}`}
      width="14"
      height="14"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
}

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
        {/*
          Controlled Spectrum Switch. Guard onChange against echoes:
          react-spectrum can fire onChange during prop-driven internal
          state sync, which — if blindly forwarded — would re-set the
          parent's on/off state to the same value and, in some
          re-render orderings, oscillate the switch. Forwarding only
          when the value actually flips makes the toggle a pure
          user-driven event.
        */}
        <Switch
          isSelected={on}
          onChange={next => {
            if (next !== on) {
              onToggle(next);
            }
          }}
          isDisabled={disabled === true}
          aria-label={title}
        />
        <span ref={buttonRef} style={{ display: 'inline-flex' }}>
          <ActionButton
            onPress={onAdd}
            isDisabled={!on || addDisabled === true || disabled === true}
          >
            Add
          </ActionButton>
        </span>
        {picker?.(buttonRef)}
      </div>
      <div style={on ? undefined : disabledBodyStyle} aria-disabled={!on}>
        {children}
      </div>
    </div>
  );
}

/**
 * Droppable ids used by the drag-and-drop context. Columns may be
 * dragged between `rollup-rows` and `pivot-columns`; aggregations are
 * a separate scope and only reorder within themselves.
 */
const ROLLUP_ROWS_DROPPABLE = 'rollup-rows';
const PIVOT_COLUMNS_DROPPABLE = 'pivot-columns';
const AGGREGATIONS_DROPPABLE = 'aggregations';

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
function DroppableList({
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
};

function columnRowId(droppableId: string, name: string): string {
  return `${droppableId}:${name}`;
}

function ColumnRow({
  name,
  droppableId,
  onDelete,
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
  const style: React.CSSProperties = {
    ...rowStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <span style={rowLabelStyle}>{name}</span>
      <Button kind="ghost" icon={vsTrash} tooltip="Remove" onClick={onDelete} />
      <span
        ref={setActivatorNodeRef}
        style={gripHandleStyle}
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
function ColumnRowPreview({ name }: { name: string }): JSX.Element {
  return (
    <div style={{ ...rowStyle, ...draggingRowStyle }}>
      <span style={rowLabelStyle}>{name}</span>
      <Button
        kind="ghost"
        icon={vsTrash}
        tooltip="Remove"
        onClick={() => undefined}
      />
      <span style={gripHandleStyle} aria-hidden>
        <GripIcon />
      </span>
    </div>
  );
}

type AggregateRowProps = {
  entry: Aggregation;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
};

function aggregationRowId(index: number): string {
  return `${AGGREGATIONS_DROPPABLE}:${index}`;
}

function formatAggLabel(entry: Aggregation): string {
  return entry.selected.length > 0
    ? `${entry.operation} (${entry.selected.join(', ')})`
    : entry.operation;
}

function AggregateRow({
  entry,
  index,
  onEdit,
  onDelete,
}: AggregateRowProps): JSX.Element {
  const id = aggregationRowId(index);
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
    ...rowStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <span style={rowLabelStyle}>{formatAggLabel(entry)}</span>
      <Button kind="ghost" icon={vsEdit} tooltip="Edit" onClick={onEdit} />
      <Button kind="ghost" icon={vsTrash} tooltip="Remove" onClick={onDelete} />
      <span
        ref={setActivatorNodeRef}
        style={gripHandleStyle}
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

function AggregateRowPreview({ entry }: { entry: Aggregation }): JSX.Element {
  return (
    <div style={{ ...rowStyle, ...draggingRowStyle }}>
      <span style={rowLabelStyle}>{formatAggLabel(entry)}</span>
      <Button
        kind="ghost"
        icon={vsEdit}
        tooltip="Edit"
        onClick={() => undefined}
      />
      <Button
        kind="ghost"
        icon={vsTrash}
        tooltip="Remove"
        onClick={() => undefined}
      />
      <span style={gripHandleStyle} aria-hidden>
        <GripIcon />
      </span>
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
}: PivotConfigSectionProps): JSX.Element {
  const [rollupPickerOpen, setRollupPickerOpen] = useState(false);
  const [pivotPickerOpen, setPivotPickerOpen] = useState(false);
  // `null` = closed. `{ mode: 'add' }` = adding new. `{ mode: 'edit', index }`
  // = editing existing entry.
  const [aggPickerState, setAggPickerState] = useState<
    { mode: 'add' } | { mode: 'edit'; index: number } | null
  >(null);
  // Tracks the source droppable while a drag is in progress; null when
  // nothing is being dragged. Used to toggle the `is-dragging` modifier
  // on the root so the drop zones render the marching-ants effect.
  const [dragSource, setDragSource] = useState<string | null>(null);

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

  // Flip `dragSource` in `onDragStart`. With @dnd-kit's
  // MeasuringStrategy.Always (set on the DndContext), every droppable
  // is re-measured continuously, so the empty drop-zones can expand
  // from 0px to their full hit-area after the drag starts and the
  // marching-ants class is applied.
  // Track the active draggable's id for the DragOverlay preview.
  const [activeId, setActiveId] = useState<string | null>(null);
  const handleDragStart = useCallback((event: DragStartEvent): void => {
    const container = String(event.active.data.current?.container ?? '');
    setDragSource(container === '' ? null : container);
    setActiveId(String(event.active.id));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const resolveContainerOfId = useCallback((id: string): string | null => {
    // Container ids are exact matches; item ids are namespaced as
    // `${container}:...`.
    if (
      id === ROLLUP_ROWS_DROPPABLE ||
      id === PIVOT_COLUMNS_DROPPABLE ||
      id === AGGREGATIONS_DROPPABLE
    ) {
      return id;
    }
    const colonIdx = id.indexOf(':');
    return colonIdx === -1 ? null : id.slice(0, colonIdx);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent): void => {
      setDragSource(null);
      setActiveId(null);
      const { active, over } = event;
      if (over == null) return;

      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);
      const fromId = resolveContainerOfId(activeIdStr);
      const toId = resolveContainerOfId(overIdStr);
      if (fromId == null || toId == null) return;

      // Aggregations are a separate scope — reorder only.
      if (fromId === AGGREGATIONS_DROPPABLE) {
        if (toId !== AGGREGATIONS_DROPPABLE) return;
        // Active id is `aggregations:<i>`, over may be `aggregations:<j>`
        // or the container id (drop at end).
        const fromIdx = aggregationSettings.aggregations.findIndex(
          (_, i) => aggregationRowId(i) === activeIdStr
        );
        if (fromIdx < 0) return;
        const toIdx =
          overIdStr === AGGREGATIONS_DROPPABLE
            ? aggregationSettings.aggregations.length - 1
            : aggregationSettings.aggregations.findIndex(
                (_, i) => aggregationRowId(i) === overIdStr
              );
        if (toIdx < 0 || fromIdx === toIdx) return;
        onAggregationSettingsChange({
          ...aggregationSettings,
          aggregations: moveItem(
            aggregationSettings.aggregations,
            fromIdx,
            toIdx
          ),
        });
        return;
      }
      // Columns can never land in the aggregations list.
      if (toId === AGGREGATIONS_DROPPABLE) return;

      const lists: Record<
        string,
        { items: string[]; set: (next: string[]) => void }
      > = {
        [ROLLUP_ROWS_DROPPABLE]: {
          items: rollupRows,
          set: onRollupRowsChange,
        },
        [PIVOT_COLUMNS_DROPPABLE]: {
          items: pivotColumns,
          set: onPivotColumnsChange,
        },
      };
      const from = lists[fromId];
      const to = lists[toId];
      if (from == null || to == null) return;

      // Recover the moved column name from the active id
      // (`${container}:${name}`).
      const colonIdx = activeIdStr.indexOf(':');
      if (colonIdx === -1) return;
      const moved = activeIdStr.slice(colonIdx + 1);
      const fromIdx = from.items.indexOf(moved);
      if (fromIdx < 0) return;

      let toIdx: number;
      if (overIdStr === toId) {
        // Dropped on container background — append.
        toIdx = to.items.length;
      } else {
        const overColon = overIdStr.indexOf(':');
        const overName =
          overColon === -1 ? overIdStr : overIdStr.slice(overColon + 1);
        const overIdx = to.items.indexOf(overName);
        toIdx = overIdx < 0 ? to.items.length : overIdx;
      }

      if (fromId === toId) {
        if (fromIdx === toIdx) return;
        from.set(moveItem(from.items, fromIdx, toIdx));
        return;
      }

      // Cross-list move. Drop silently if the column already exists in
      // the destination list (no duplicates within a card).
      if (to.items.includes(moved)) return;
      from.set(removeAt(from.items.slice(), fromIdx));
      const nextTo = to.items.slice();
      nextTo.splice(Math.min(toIdx, nextTo.length), 0, moved);
      to.set(nextTo);
    },
    [
      aggregationSettings,
      onAggregationSettingsChange,
      onPivotColumnsChange,
      onRollupRowsChange,
      pivotColumns,
      resolveContainerOfId,
      rollupRows,
    ]
  );

  const handleDragCancel = useCallback((): void => {
    setDragSource(null);
    setActiveId(null);
  }, []);

  const rollupItemIds = useMemo(
    () => rollupRows.map(n => columnRowId(ROLLUP_ROWS_DROPPABLE, n)),
    [rollupRows]
  );
  const pivotItemIds = useMemo(
    () => pivotColumns.map(n => columnRowId(PIVOT_COLUMNS_DROPPABLE, n)),
    [pivotColumns]
  );
  const aggItemIds = useMemo(
    () => aggregationSettings.aggregations.map((_, i) => aggregationRowId(i)),
    [aggregationSettings.aggregations]
  );

  const pivotActive =
    pivotColumnsOn && pivotColumns.length > 0 && pivotColumnsDisabled !== true;

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
    const idx = colonIdx === -1 ? -1 : Number(activeId.slice(colonIdx + 1));
    return aggregationSettings.aggregations[idx] ?? null;
  })();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <style>{PIVOT_DND_STYLES}</style>
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
        }`}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
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
          <DroppableList
            id={ROLLUP_ROWS_DROPPABLE}
            type="columns"
            itemIds={rollupItemIds}
            isEmpty={rollupRows.length === 0}
          >
            {rollupRows.map((name, i) => (
              <ColumnRow
                key={columnRowId(ROLLUP_ROWS_DROPPABLE, name)}
                name={name}
                droppableId={ROLLUP_ROWS_DROPPABLE}
                onDelete={() => onRollupRowsChange(removeAt(rollupRows, i))}
              />
            ))}
          </DroppableList>
        </ConfigCard>

        <ConfigCard
          title="Pivot columns"
          on={pivotColumnsOn && pivotColumnsDisabled !== true}
          onToggle={onPivotColumnsOnChange}
          onAdd={handleAddPivotColumn}
          addDisabled={false}
          disabled={pivotColumnsDisabled === true}
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
          <DroppableList
            id={PIVOT_COLUMNS_DROPPABLE}
            type="columns"
            itemIds={pivotItemIds}
            isEmpty={pivotColumns.length === 0}
            disabled={pivotColumnsDisabled === true}
          >
            {pivotColumns.map((name, i) => (
              <ColumnRow
                key={columnRowId(PIVOT_COLUMNS_DROPPABLE, name)}
                name={name}
                droppableId={PIVOT_COLUMNS_DROPPABLE}
                onDelete={() => onPivotColumnsChange(removeAt(pivotColumns, i))}
              />
            ))}
          </DroppableList>
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
          <DroppableList
            id={AGGREGATIONS_DROPPABLE}
            type="aggregations"
            itemIds={aggItemIds}
            isEmpty={aggregationSettings.aggregations.length === 0}
          >
            {aggregationSettings.aggregations.map((entry, i) => (
              <AggregateRow
                // eslint-disable-next-line react/no-array-index-key
                key={`${entry.operation}-${i}`}
                entry={entry}
                index={i}
                onEdit={() => handleEditAggregate(i)}
                onDelete={() => handleDeleteAggregate(i)}
              />
            ))}
          </DroppableList>
        </ConfigCard>

        {/* Filterable columns card hidden for now \u2014 props are still threaded
          through so it can be re-enabled without churn. */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Checkbox
            checked={pivotActive ? false : includeConstituents}
            disabled={pivotActive}
            onChange={e => onIncludeConstituentsChange(e.target.checked)}
          >
            Include constituents in rollups rows
          </Checkbox>
          <Checkbox
            checked={pivotActive ? false : nonAggregatedInRollup}
            disabled={pivotActive}
            onChange={e => onNonAggregatedInRollupChange(e.target.checked)}
          >
            Non-aggregated in rollup rows
          </Checkbox>
        </div>
      </div>
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {activeColumnName != null ? (
            <ColumnRowPreview name={activeColumnName} />
          ) : activeAggregation != null ? (
            <AggregateRowPreview entry={activeAggregation} />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default PivotConfigSection;
