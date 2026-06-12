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
  GLOBAL_SHORTCUTS,
  Icon,
  Item,
  Keyboard,
  MenuTrigger,
  Picker,
  SearchInput,
  Section,
  Select,
  SpectrumMenu,
  Switch,
  Text,
} from '@deephaven/components';
import {
  vsBlank,
  vsCheck,
  vsGripper,
  vsKebabVertical,
  vsTrash,
} from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  min-height: 2px;
  border-radius: 2px;
  transition: background-color 0.15s ease;
}
.pivot-config-section .pivot-droppable-empty {
  min-height: 20px;
  margin: 1px 0;
  padding: 2px;
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
/* Compact row buttons: the base .btn has a 32px height; shrink the
 * inline row action buttons (e.g. Remove) to keep list rows dense. */
.pivot-config-section .btn.pivot-row-btn {
  height: 28px;
  min-height: 28px;
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

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--dh-color-border-base, #444)',
  borderRadius: 4,
  padding: '6px 8px',
  background: 'var(--dh-color-bg-200, transparent)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  marginBottom: 2,
};

const cardTitleStyle: React.CSSProperties = {
  flex: 1,
  fontWeight: 600,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 2px',
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

/** Drag-handle grip icon. */
function GripIcon(): JSX.Element {
  return <FontAwesomeIcon icon={vsGripper} />;
}

// Body styling for a card toggled "off". The card is visually de-emphasised
// (reduced opacity) but stays interactive so its list can still be edited
// (add / remove / reorder). Hard-disabled cards (see ConfigCard `disabled`)
// block interaction at the card root instead.
const disabledBodyStyle: React.CSSProperties = {
  opacity: 0.4,
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

type OverflowMenuItem = {
  /** Stable key identifying the item; passed back to `onAction`. */
  key: string;
  /** Visible label. */
  label: string;
  /**
   * Toggle state. When `true` the item shows a leading checkmark; when `false`
   * the checkmark column is blank. When `undefined` the item is a plain action
   * (also blank), so toggles and actions can be mixed in the same menu. Every
   * item reserves the leading icon column so labels stay aligned.
   */
  isSelected?: boolean;
  /**
   * Optional keyboard-shortcut hint, shown right-aligned in the menu row via
   * Spectrum's `Keyboard` element (matching the Organize Columns menu).
   */
  shortcut?: string;
};

/**
 * A group of {@link OverflowMenuItem}s. Spectrum draws a divider before every
 * section after the first, so each section boundary renders a separator —
 * mirroring the grouped "Organize Columns" overflow menu in
 * `@deephaven/iris-grid`.
 */
type OverflowMenuSection = {
  /** Stable key identifying the section. */
  key: string;
  /** Items rendered within the section. */
  items: OverflowMenuItem[];
};

type OverflowMenuProps = {
  /**
   * Sections rendered in the menu, with a separator drawn between each.
   * Memoize for a stable reference.
   */
  sections: OverflowMenuSection[];
  /** Keys of items rendered as disabled. */
  disabledKeys?: Iterable<string>;
  /** Accessible label / tooltip for the kebab (⋮) trigger. */
  tooltip: string;
  /** Invoked with the key of the activated item. */
  onAction: (key: string) => void;
  /** Invoked when the menu opens (e.g. to dismiss other open popovers). */
  onOpen?: () => void;
};

/**
 * A kebab (⋮) button that opens a Spectrum `Menu`, mirroring the Organize
 * Columns overflow menu in `@deephaven/iris-grid`. `MenuTrigger` owns the
 * open/close state. Items may be plain actions or checkable toggles
 * (`isSelected` defined): a toggle's leading checkmark is swapped between
 * `vsCheck` and `vsBlank` via `FontAwesomeIcon`, exactly like the
 * "Show hidden columns" item there.
 */
function OverflowMenu({
  sections,
  disabledKeys,
  tooltip,
  onAction,
  onOpen,
}: OverflowMenuProps): JSX.Element {
  return (
    <MenuTrigger
      closeOnSelect
      onOpenChange={isOpen => {
        if (isOpen) {
          onOpen?.();
        }
      }}
    >
      <ActionButton isQuiet aria-label={tooltip}>
        <FontAwesomeIcon icon={vsKebabVertical} />
      </ActionButton>
      <SpectrumMenu
        disabledKeys={disabledKeys}
        onAction={key => onAction(String(key))}
      >
        {sections.map(section => (
          <Section key={section.key}>
            {section.items.map(item => (
              <Item key={item.key} textValue={item.label}>
                <Icon>
                  <FontAwesomeIcon
                    icon={item.isSelected === true ? vsCheck : vsBlank}
                  />
                </Icon>
                <Text>{item.label}</Text>
                {item.shortcut != null && <Keyboard>{item.shortcut}</Keyboard>}
              </Item>
            ))}
          </Section>
        ))}
      </SpectrumMenu>
    </MenuTrigger>
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
  /** Optional overflow (⋮) menu rendered after the Add button. */
  overflow?: React.ReactNode;
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
  overflow,
  picker,
  children,
}: ConfigCardProps): JSX.Element {
  const buttonRef = useRef<HTMLSpanElement>(null);
  // A card toggled "off" (or hard-disabled) gets a dark, disabled-state
  // border so it reads as inactive while its boundary stays clearly visible.
  // Hard-disabled cards additionally fade out and block all interaction;
  // a merely "off" card stays interactive so its list can still be edited.
  let rootCardStyle: React.CSSProperties = cardStyle;
  if (disabled === true) {
    rootCardStyle = {
      ...cardStyle,
      border: '1px solid var(--dh-color-bg, #000)',
      opacity: 0.5,
      pointerEvents: 'none',
    };
  } else if (!on) {
    rootCardStyle = {
      ...cardStyle,
      border: '1px solid var(--dh-color-bg, #000)',
    };
  }
  return (
    <div style={rootCardStyle} aria-disabled={disabled === true}>
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
            isDisabled={addDisabled === true || disabled === true}
          >
            Add
          </ActionButton>
        </span>
        {overflow}
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
      <Button
        kind="ghost"
        className="btn-small pivot-row-btn"
        icon={vsTrash}
        tooltip="Remove"
        onClick={onDelete}
      />
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
        className="btn-small pivot-row-btn"
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

type AggregateSelectRowProps = {
  id: string;
  operation: string;
  columnLabels: readonly string[];
  availableOperations: readonly string[];
  onOperationChange: (operation: string) => void;
  onDelete: () => void;
  /**
   * When true the aggregate function is rendered as plain read-only text
   * (just the operation name) instead of an editable picker, and the column
   * labels are omitted. Used for the collapsed Count row in the ungrouped
   * (pivot) layout.
   */
  staticOperation?: boolean;
};

/**
 * Stable sortable id for a grouped aggregate row (one row per operation).
 * Keyed by the operation rather than its index so a reorder moves the DOM
 * node (and animates) instead of mutating content in place — positional ids
 * stay at the same slot after a reorder, which makes dnd-kit's drop animation
 * snap the dragged row back to where it started.
 */
function aggregationRowId(operation: string): string {
  return `${AGGREGATIONS_DROPPABLE}:${operation}`;
}

/**
 * Stable sortable id for a single function/column pair (used by the ungrouped
 * aggregate layout). Keyed by the operation + column content (separated by a
 * NUL so it never collides with a column name) rather than positional indices,
 * for the same reorder-animation reason as `aggregationRowId`. The container
 * still resolves on the first `:`.
 */
function aggregationPairId(operation: string, column: string): string {
  return `${AGGREGATIONS_DROPPABLE}:${operation}\u0000${column}`;
}

/**
 * The Count aggregation is a special case: it counts rows in each group
 * rather than aggregating a specific column. In the ungrouped (pivot) layout
 * all Count selections collapse into a single read-only "Count" row (no
 * column, no function picker). This is a display-only treatment — the
 * underlying `AggregationSettings` keeps the original Count entry untouched so
 * the grouped (non-pivot) layout still shows its columns and switching between
 * the two display modes is lossless.
 */
const COUNT_OPERATION: string = AggregationOperation.COUNT;

function isCountOperation(operation: string): boolean {
  return operation === COUNT_OPERATION;
}

function formatAggLabel(entry: Aggregation): string {
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
function AggregateSelectRow({
  id,
  operation,
  columnLabels,
  availableOperations,
  onOperationChange,
  onDelete,
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
    ...rowStyle,
    // Stack the function/columns vertically so the delete + drag icons can
    // sit on the same centered line as the aggregate-function picker (the
    // column labels flow underneath).
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {staticOperation ? (
            <span style={rowLabelStyle}>{operation}</span>
          ) : (
            <Picker
              isQuiet
              aria-label="Aggregation function"
              selectedKey={operation}
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
        <Button
          kind="ghost"
          className="btn-small pivot-row-btn"
          icon={vsTrash}
          tooltip="Remove"
          onClick={onDelete}
        />
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
      {staticOperation
        ? null
        : columnLabels.map(label => (
            <span key={label} style={rowLabelStyle}>
              {label}
            </span>
          ))}
    </div>
  );
}

function AggregateRowPreview({
  entry,
  label,
}: {
  entry: Aggregation;
  label?: string;
}): JSX.Element {
  return (
    <div style={{ ...rowStyle, ...draggingRowStyle }}>
      <span style={rowLabelStyle}>{label ?? formatAggLabel(entry)}</span>
      <Button
        kind="ghost"
        className="btn-small pivot-row-btn"
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
  /** Columns already selected per operation in the card, so switching the
   *  function in the picker reveals that function's existing columns. */
  existingSelections: Readonly<Record<string, readonly string[]>>;
  onCommit: (next: Aggregation) => void;
  onClose: () => void;
};

function AggregatePicker({
  anchorRef,
  availableColumns,
  columnTypes,
  availableOperations,
  initial,
  existingSelections,
  onCommit,
  onClose,
}: AggregatePickerProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const [operation, setOperation] = useState<string>(initial.operation);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(existingSelections[initial.operation] ?? initial.selected)
  );
  const [query, setQuery] = useState('');
  const pos = usePortalAnchorPosition(anchorRef, containerRef);

  // When the function changes, load the columns already selected for that
  // function so the multi-select reflects the current card state. Guarded
  // by a ref so toggling columns (which doesn't change `operation`) and
  // parent re-renders don't clobber the user's in-progress selection.
  const prevOperationRef = useRef(operation);
  useEffect(() => {
    if (prevOperationRef.current !== operation) {
      prevOperationRef.current = operation;
      setSelected(new Set(existingSelections[operation] ?? []));
    }
  }, [operation, existingSelections]);

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
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearAll,
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

  // Local toggle for the "Show hidden columns in menu" overflow item. There
  // is no hidden-columns concept threaded through the plugin yet, so this
  // simply tracks the checkmark state for now.
  const [showHiddenColumns, setShowHiddenColumns] = useState(false);

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
      // Operations are unique per card; ignore a change that collides with
      // an operation already used by another entry.
      if (aggregations.some((a, i) => i !== index && a.operation === nextOp)) {
        return;
      }
      aggregations[index] = {
        ...current,
        operation: nextOp as AggregationOperation,
      };
      onAggregationSettingsChange({ ...aggregationSettings, aggregations });
    },
    [aggregationSettings, onAggregationSettingsChange]
  );

  // Ungrouped layout (pivot/rollup present): change the function of a
  // single function/column pair. Moves the column out of its current entry
  // into the entry for the target function (creating one if needed). The
  // underlying model keeps one entry per operation, so the column merges
  // into any existing entry for `nextOp`.
  const handleChangeAggregatePairOperation = useCallback(
    (entryIndex: number, column: string, nextOp: string) => {
      let aggregations = aggregationSettings.aggregations.map(a => ({
        ...a,
        selected: a.selected.slice(),
      }));
      const source = aggregations[entryIndex];
      if (source == null || source.operation === nextOp) {
        return;
      }
      if (column === '') {
        // Empty placeholder entry: relabel it, or drop it if the target
        // already exists.
        const dest = aggregations.find(a => a.operation === nextOp);
        if (dest == null) {
          source.operation = nextOp as AggregationOperation;
        } else {
          aggregations = aggregations.filter(a => a !== source);
        }
      } else {
        source.selected = source.selected.filter(c => c !== column);
        const dest = aggregations.find(a => a.operation === nextOp);
        if (dest == null) {
          aggregations.push({
            operation: nextOp as AggregationOperation,
            selected: [column],
            invert: false,
          });
        } else if (!dest.selected.includes(column)) {
          dest.selected.push(column);
        }
        if (source.selected.length === 0) {
          aggregations = aggregations.filter(a => a !== source);
        }
      }
      onAggregationSettingsChange({ ...aggregationSettings, aggregations });
    },
    [aggregationSettings, onAggregationSettingsChange]
  );

  // Ungrouped layout: remove a single function/column pair. Removes the
  // column from its entry, dropping the entry if it becomes empty.
  const handleDeleteAggregatePair = useCallback(
    (entryIndex: number, column: string) => {
      let aggregations = aggregationSettings.aggregations.map(a => ({
        ...a,
        selected: a.selected.slice(),
      }));
      const source = aggregations[entryIndex];
      if (source == null) {
        return;
      }
      if (column === '') {
        aggregations = aggregations.filter(a => a !== source);
      } else {
        source.selected = source.selected.filter(c => c !== column);
        if (source.selected.length === 0) {
          aggregations = aggregations.filter(a => a !== source);
        }
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
  // Container of the in-flight drag. Unlike `activeId`/`dragSource` (cleared
  // at the top of `handleDragEnd`), this survives the drop so the drag
  // overlay can still tell what kind of item it just released while it plays
  // its drop animation. Reset only on the next drag start.
  const activeContainerRef = useRef<string | null>(null);
  const handleDragStart = useCallback((event: DragStartEvent): void => {
    const container = String(event.active.data.current?.container ?? '');
    activeContainerRef.current = container === '' ? null : container;
    setDragSource(container === '' ? null : container);
    setActiveId(String(event.active.id));
  }, []);

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

        // Grouped layout (no pivot/rollup): ids are `aggregations:<operation>`
        // and each row is a whole entry — reorder the entries directly.
        const groupedFromIdx = aggregationSettings.aggregations.findIndex(
          entry => aggregationRowId(entry.operation as string) === activeIdStr
        );
        if (groupedFromIdx >= 0) {
          const toIdx =
            overIdStr === AGGREGATIONS_DROPPABLE
              ? aggregationSettings.aggregations.length - 1
              : aggregationSettings.aggregations.findIndex(
                  entry =>
                    aggregationRowId(entry.operation as string) === overIdStr
                );
          if (toIdx < 0 || groupedFromIdx === toIdx) return;
          onAggregationSettingsChange({
            ...aggregationSettings,
            aggregations: moveItem(
              aggregationSettings.aggregations,
              groupedFromIdx,
              toIdx
            ),
          });
          return;
        }

        // Ungrouped layout (pivot/rollup active): ids are
        // `aggregations:<operation>\u0000<column>`, one row per function/column
        // pair. Reorder the flat list of pairs, then rebuild one entry per
        // operation (in order of first appearance). The model can't represent
        // interleaved operations, so a column dropped between two columns of a
        // different operation regroups under its own entry.
        const pairs: { operation: string; column: string }[] = [];
        const pairIds: string[] = [];
        aggregationSettings.aggregations.forEach(entry => {
          // Count is collapsed into a single column-less row in this layout,
          // so it reorders as one unit (matching the rendered row id).
          if (
            entry.selected.length === 0 ||
            isCountOperation(entry.operation as string)
          ) {
            pairs.push({ operation: entry.operation as string, column: '' });
            pairIds.push(aggregationPairId(entry.operation as string, ''));
          } else {
            entry.selected.forEach(column => {
              pairs.push({ operation: entry.operation as string, column });
              pairIds.push(
                aggregationPairId(entry.operation as string, column)
              );
            });
          }
        });
        const fromIdx = pairIds.indexOf(activeIdStr);
        if (fromIdx < 0) return;
        const toIdx =
          overIdStr === AGGREGATIONS_DROPPABLE
            ? pairIds.length - 1
            : pairIds.indexOf(overIdStr);
        if (toIdx < 0 || fromIdx === toIdx) return;

        const reordered = moveItem(pairs, fromIdx, toIdx);

        const invertByOp = new Map<string, boolean>();
        // Count collapses to a column-less pair above, so its columns are not
        // carried in `reordered`; preserve the original selection so the
        // reorder stays display-only and the data round-trips.
        const selectedByOp = new Map<string, string[]>();
        aggregationSettings.aggregations.forEach(entry => {
          invertByOp.set(entry.operation as string, entry.invert);
          selectedByOp.set(entry.operation as string, entry.selected.slice());
        });
        const byOp = new Map<string, { selected: string[]; invert: boolean }>();
        reordered.forEach(({ operation, column }) => {
          let entry = byOp.get(operation);
          if (entry == null) {
            entry = {
              selected: [],
              invert: invertByOp.get(operation) ?? false,
            };
            byOp.set(operation, entry);
          }
          if (column !== '') {
            entry.selected.push(column);
          }
        });
        // Restore Count's original columns (it contributes a column-less pair).
        byOp.forEach((entry, operation) => {
          if (isCountOperation(operation)) {
            const original = selectedByOp.get(operation);
            if (original != null) {
              entry.selected.push(...original);
            }
          }
        });
        onAggregationSettingsChange({
          ...aggregationSettings,
          aggregations: Array.from(byOp.entries()).map(
            ([operation, { selected, invert }]) => ({
              operation: operation as AggregationOperation,
              selected,
              invert,
            })
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

  // Columns already used by either the Rollup rows or Pivot columns card.
  // Excluded from both Add pickers so a column can't be selected twice.
  const usedColumns = useMemo(
    () => [...rollupRows, ...pivotColumns],
    [rollupRows, pivotColumns]
  );

  const pivotActive =
    pivotColumnsOn && pivotColumns.length > 0 && pivotColumnsDisabled !== true;
  const rollupActive = rollupRowsOn && rollupRows.length > 0;

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
  // section is separated by a divider. The leading sections are
  // aggregate-wide actions/toggles; the final section holds the rollup-row
  // toggles, which show a checkmark when enabled and are disabled while a
  // pivot is active.
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
    [
      showHiddenColumns,
      includeConstituents,
      nonAggregatedInRollup,
      undoRedoSection,
    ]
  );

  const rollupMenuDisabledKeys = useMemo<string[]>(
    () => [
      ...(pivotActive ? ['includeConstituents', 'nonAggregatedInRollup'] : []),
      ...undoRedoDisabledKeys,
    ],
    [pivotActive, undoRedoDisabledKeys]
  );

  // Items for the Aggregate values card overflow (⋮) menu. Shares the three
  // aggregate-wide actions/toggles with the Rollup menu, each in its own
  // section so a divider is drawn between them.
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
    [aggregationSettings.showOnTop, showHiddenColumns, undoRedoSection]
  );

  // Items for the Pivot columns card overflow (⋮) menu. Each item in its
  // own section so a divider is drawn between them.
  const pivotMenuSections = useMemo<OverflowMenuSection[]>(
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
    [showHiddenColumns, undoRedoSection]
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

  // With neither a pivot nor a rollup configured, the aggregate card groups
  // columns by function (one row per function). When a pivot or rollup is
  // present we keep the same two-line picker layout but list every
  // function/column pair separately (ungrouped).
  const onlyAggregates = !pivotActive && !rollupActive;

  // Flattened function/column pairs for the ungrouped layout. Entries with
  // no columns yet are surfaced as a single placeholder pair so the row
  // still renders.
  const aggregatePairs = useMemo(() => {
    const pairs: {
      operation: string;
      column: string;
      entryIndex: number;
      columnIndex: number;
    }[] = [];
    aggregationSettings.aggregations.forEach((entry, entryIndex) => {
      // Count collapses into a single column-less row regardless of how many
      // columns it has selected (display-only; the entry keeps its columns).
      if (
        entry.selected.length === 0 ||
        isCountOperation(entry.operation as string)
      ) {
        pairs.push({
          operation: entry.operation as string,
          column: '',
          entryIndex,
          columnIndex: -1,
        });
      } else {
        entry.selected.forEach((column, columnIndex) => {
          pairs.push({
            operation: entry.operation as string,
            column,
            entryIndex,
            columnIndex,
          });
        });
      }
    });
    return pairs;
  }, [aggregationSettings.aggregations]);

  const aggItemIds = useMemo(
    () =>
      onlyAggregates
        ? aggregationSettings.aggregations.map(entry =>
            aggregationRowId(entry.operation as string)
          )
        : aggregatePairs.map(p => aggregationPairId(p.operation, p.column)),
    [onlyAggregates, aggregationSettings.aggregations, aggregatePairs]
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
    // Grouped layout ids are `AGGREGATIONS:<operation>`; ungrouped
    // (function/column pair) ids are `AGGREGATIONS:<operation>\u0000<column>`.
    const suffix = activeId.slice(colonIdx + 1);
    const sepIdx = suffix.indexOf('\u0000');
    if (sepIdx === -1) {
      return (
        aggregationSettings.aggregations.find(a => a.operation === suffix) ??
        null
      );
    }
    const operation = suffix.slice(0, sepIdx);
    const column = suffix.slice(sepIdx + 1);
    const entry = aggregationSettings.aggregations.find(
      a => a.operation === operation
    );
    if (entry == null) {
      return null;
    }
    // Preview just the single dragged column so the overlay matches the row.
    return column === '' ? entry : { ...entry, selected: [column] };
  })();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
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
                available={availableColumns}
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
          overflow={
            <OverflowMenu
              sections={pivotMenuSections}
              disabledKeys={undoRedoDisabledKeys}
              tooltip="Pivot options"
              onAction={handleConfigMenuAction}
              onOpen={closeAllPickers}
            />
          }
          picker={anchorRef =>
            pivotPickerOpen ? (
              <ColumnPicker
                anchorRef={anchorRef}
                available={availableColumns}
                excluded={usedColumns}
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
          overflow={
            <OverflowMenu
              sections={aggregateMenuSections}
              disabledKeys={undoRedoDisabledKeys}
              tooltip="Aggregate options"
              onAction={handleConfigMenuAction}
              onOpen={closeAllPickers}
            />
          }
          picker={anchorRef =>
            aggPickerState != null ? (
              <AggregatePicker
                anchorRef={anchorRef}
                availableColumns={availableColumns}
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
            {onlyAggregates
              ? aggregationSettings.aggregations.map((entry, i) => (
                  <AggregateSelectRow
                    key={aggregationRowId(entry.operation as string)}
                    id={aggregationRowId(entry.operation as string)}
                    operation={entry.operation}
                    columnLabels={entry.selected}
                    availableOperations={selectableOperations.filter(
                      op =>
                        op === entry.operation || !usedOperations.includes(op)
                    )}
                    onOperationChange={op =>
                      handleChangeAggregateOperation(i, op)
                    }
                    onDelete={() => handleDeleteAggregate(i)}
                  />
                ))
              : aggregatePairs.map(pair => (
                  <AggregateSelectRow
                    key={aggregationPairId(pair.operation, pair.column)}
                    id={aggregationPairId(pair.operation, pair.column)}
                    operation={pair.operation}
                    columnLabels={pair.column === '' ? [] : [pair.column]}
                    availableOperations={selectableOperations}
                    staticOperation={isCountOperation(pair.operation)}
                    onOperationChange={op =>
                      handleChangeAggregatePairOperation(
                        pair.entryIndex,
                        pair.column,
                        op
                      )
                    }
                    onDelete={() =>
                      handleDeleteAggregatePair(pair.entryIndex, pair.column)
                    }
                  />
                ))}
          </DroppableList>
        </ConfigCard>

        {/* Filterable columns card hidden for now \u2014 props are still threaded
          through so it can be re-enabled without churn. */}
      </div>
      {createPortal(
        // Aggregations can't be interleaved across operations (the pivot
        // payload groups columns by operation), so a cross-operation drop
        // regroups the dragged row back into its own operation. Play the
        // default drop animation for aggregation drags so that snap-back is
        // visible instead of looking like a no-op; column drags keep the
        // instant drop (no animation).
        <DragOverlay
          dropAnimation={
            activeContainerRef.current === AGGREGATIONS_DROPPABLE
              ? undefined
              : null
          }
        >
          {activeColumnName != null ? (
            <ColumnRowPreview name={activeColumnName} />
          ) : activeAggregation != null ? (
            <AggregateRowPreview
              entry={activeAggregation}
              label={
                !onlyAggregates &&
                isCountOperation(activeAggregation.operation as string)
                  ? COUNT_OPERATION
                  : undefined
              }
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default PivotConfigSection;
