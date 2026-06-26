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
  DndKitCore,
  DndKitSortable,
  DndKitUtilities,
} from '@deephaven/iris-grid';
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
  ReactFontAwesome,
} from '@deephaven/components';
import {
  vsBlank,
  vsCheck,
  vsDiscard,
  vsGripper,
  vsKebabVertical,
  vsRedo,
  vsTrash,
} from '@deephaven/icons';
import {
  AggregationOperation,
  AggregationUtils,
  type Aggregation,
  type AggregationSettings,
} from '@deephaven/iris-grid';
import { usePivotServiceStatus } from './PivotServiceContext';

const {
  closestCenter,
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} = DndKitCore;
const { SortableContext, useSortable, verticalListSortingStrategy } =
  DndKitSortable;
const { CSS } = DndKitUtilities;

const { FontAwesomeIcon } = ReactFontAwesome;

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

/** Drag-handle grip icon. */
function GripIcon(): JSX.Element {
  return <FontAwesomeIcon icon={vsGripper} />;
}

/** Message displayed in the Pivot columns card when the service is unavailable. */
function ServiceUnavailableMessage(): JSX.Element {
  return (
    <div className="pivot-service-unavailable">Pivot service not available</div>
  );
}

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
      className="pivot-popover"
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        right: pos?.right ?? 0,
        visibility: pos == null ? 'hidden' : 'visible',
      }}
      role="dialog"
    >
      <div className="pivot-popover-search">
        <SearchInput
          ref={searchRef}
          value={query}
          placeholder={placeholder}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="pivot-popover-list" role="listbox">
        {filtered.length === 0 ? (
          <div className="pivot-popover-empty">No options</div>
        ) : (
          filtered.map((name, i) => (
            // eslint-disable-next-line jsx-a11y/interactive-supports-focus
            <div
              key={name}
              role="option"
              aria-selected={i === activeIndex}
              className={`pivot-popover-item${
                i === activeIndex ? ' pivot-popover-item--active' : ''
              }`}
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
  /**
   * When true, only the per-card on/off Switch is locked; the rest of
   * the card (Add, overflow menu, list edits, drag-and-drop) stays
   * interactive. Used by the global "Toggle" so the user can keep
   * arranging columns without flipping individual card states.
   */
  toggleLocked?: boolean;
  /** When true, render a divider under the title to set off the body. */
  hasBody?: boolean;
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
  toggleLocked,
  hasBody,
  overflow,
  picker,
  children,
}: ConfigCardProps): JSX.Element {
  const buttonRef = useRef<HTMLSpanElement>(null);
  // A card toggled "off" (or hard-disabled) gets a dark, disabled-state
  // border so it reads as inactive while its boundary stays clearly visible.
  // Hard-disabled cards additionally fade out and block all interaction;
  // a merely "off" card stays interactive so its list can still be edited.
  let cardModifier = '';
  if (disabled === true) {
    cardModifier = ' pivot-card--disabled';
  } else if (!on) {
    cardModifier = ' pivot-card--off';
  }
  return (
    <div
      className={`pivot-card${cardModifier}`}
      aria-disabled={disabled === true}
    >
      <div
        className={`pivot-card-header${
          hasBody === true ? ' pivot-card-header--with-body' : ''
        }`}
      >
        <span className="pivot-card-title">{title}</span>
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
          isDisabled={disabled === true || toggleLocked === true}
          aria-label={title}
        />
        <span ref={buttonRef} className="pivot-add-anchor">
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
      <div
        className={on ? undefined : 'pivot-card-body--off'}
        aria-disabled={!on}
      >
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

/** Empty row-height placeholder marking where a cross-card drag will drop. */
function DropIndicator(): JSX.Element {
  return <div className="pivot-drop-indicator" aria-hidden />;
}

/**
 * Splice a {@link DropIndicator} into a list of rendered rows at `index`
 * (clamped to the row count). Returns the rows unchanged when `index` is
 * null.
 */
function withDropIndicator(
  rows: JSX.Element[],
  index: number | null
): React.ReactNode {
  if (index == null) {
    return rows;
  }
  const clamped = Math.max(0, Math.min(index, rows.length));
  return [
    ...rows.slice(0, clamped),
    <DropIndicator key="pivot-drop-indicator" />,
    ...rows.slice(clamped),
  ];
}

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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };
  return (
    <div ref={setNodeRef} className="pivot-row" style={style}>
      <span className="pivot-row-label pivot-column-name">{name}</span>
      <Button
        kind="ghost"
        className="btn-small pivot-row-btn"
        icon={vsTrash}
        tooltip="Remove"
        onClick={onDelete}
      />
      <span
        ref={setActivatorNodeRef}
        className="pivot-grip"
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
    <div className="pivot-row pivot-row--dragging">
      <span className="pivot-row-label pivot-column-name">{name}</span>
      <Button
        kind="ghost"
        className="btn-small pivot-row-btn"
        icon={vsTrash}
        tooltip="Remove"
        onClick={() => undefined}
      />
      <span className="pivot-grip" aria-hidden>
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
   * When provided, each column label renders with its own remove button so a
   * single column can be dropped from the function's selection. Used by the
   * grouped (non-pivot) layout where one row lists all of a function's
   * columns; omitted in the ungrouped layout where each function/column pair
   * is already its own deletable row.
   */
  onDeleteColumn?: (column: string) => void;
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
  onDeleteColumn,
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
    opacity: isDragging ? 0 : 1,
  };
  return (
    <div ref={setNodeRef} className="pivot-row" style={style}>
      <div className="pivot-agg-row-line">
        <div className="pivot-agg-row-picker">
          {staticOperation ? (
            <span className="pivot-row-label">{operation}</span>
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
          className="pivot-grip"
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
        : columnLabels.map(label =>
            onDeleteColumn != null ? (
              <div key={label} className="pivot-agg-row-line">
                <span className="pivot-row-label pivot-column-name">
                  {label}
                </span>
                <Button
                  kind="ghost"
                  className="btn-small pivot-row-btn"
                  icon={vsTrash}
                  tooltip="Remove column"
                  onClick={() => onDeleteColumn(label)}
                />
                {/* Invisible spacer matching the grip handle on the function
                  line so the column remove buttons align with the
                  function's. */}
                <span className="pivot-grip pivot-grip--hidden" aria-hidden>
                  <GripIcon />
                </span>
              </div>
            ) : (
              <span key={label} className="pivot-row-label pivot-column-name">
                {label}
              </span>
            )
          )}
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
    <div className="pivot-row pivot-row--dragging">
      <span className="pivot-row-label">{label ?? formatAggLabel(entry)}</span>
      <Button
        kind="ghost"
        className="btn-small pivot-row-btn"
        icon={vsTrash}
        tooltip="Remove"
        onClick={() => undefined}
      />
      <span className="pivot-grip" aria-hidden>
        <GripIcon />
      </span>
    </div>
  );
}

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
      className="pivot-popover pivot-agg-popover"
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        right: pos?.right ?? 0,
        visibility: pos == null ? 'hidden' : 'visible',
      }}
      role="dialog"
    >
      <div>
        <div className="pivot-agg-field-label">Select aggregation</div>
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
      <div className="pivot-agg-column-group">
        <div className="pivot-agg-field-label">
          Select column(s)
          <span className="pivot-agg-required">*</span>
        </div>
        <SearchInput
          value={query}
          placeholder="Find column..."
          onChange={e => setQuery(e.target.value)}
        />
        <div className="pivot-agg-column-list">
          {filteredColumns.length === 0 ? (
            <div className="pivot-popover-empty">No columns</div>
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
      <div className="pivot-agg-footer">
        <Button kind="ghost" onClick={handleSelectAll}>
          Select All
        </Button>
        <Button kind="ghost" onClick={handleClear}>
          Clear
        </Button>
        <span className="pivot-spacer" />
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
  // Tracks the source droppable while a drag is in progress; null when
  // nothing is being dragged. Used to toggle the `is-dragging` modifier
  // on the root so the drop zones render the marching-ants effect.
  const [dragSource, setDragSource] = useState<string | null>(null);
  // Id of the droppable/row currently under the pointer during a drag.
  // Drives the cross-card insertion indicator; null when idle.
  const [overId, setOverId] = useState<string | null>(null);

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
  const handleDragStart = useCallback(
    (event: DndKitCore.DragStartEvent): void => {
      const container = String(event.active.data.current?.container ?? '');
      activeContainerRef.current = container === '' ? null : container;
      setDragSource(container === '' ? null : container);
      setActiveId(String(event.active.id));
      setOverId(null);
    },
    []
  );

  const handleDragOver = useCallback(
    (event: DndKitCore.DragOverEvent): void => {
      const { over } = event;
      setOverId(over == null ? null : String(over.id));
    },
    []
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
    (event: DndKitCore.DragEndEvent): void => {
      setDragSource(null);
      setActiveId(null);
      setOverId(null);
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

        // Aggregation row ids are `aggregations:<operation>` and each row is
        // a whole entry — reorder the entries directly.
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
    setOverId(null);
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
    [activeId, overId, resolveContainerOfId]
  );

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

  // Drag overlay contents: a column preview, an aggregation preview, or
  // nothing, depending on what (if anything) is currently being dragged.
  let dragOverlayPreview: React.ReactNode = null;
  if (activeColumnName != null) {
    dragOverlayPreview = <ColumnRowPreview name={activeColumnName} />;
  } else if (activeAggregation != null) {
    dragOverlayPreview = <AggregateRowPreview entry={activeAggregation} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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
        }`}
      >
        <div className="pivot-toolbar">
          <span>Toggle</span>
          <Switch
            isSelected={globalOn}
            onChange={next => {
              if (next !== globalOn) {
                onGlobalOnChange(next);
              }
            }}
            aria-label="Toggle"
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
            itemIds={rollupItemIds}
            isEmpty={rollupRows.length === 0}
            disabled={rollupRowsDisabled === true}
          >
            {withDropIndicator(
              rollupRows.map((name, i) => (
                <ColumnRow
                  key={columnRowId(ROLLUP_ROWS_DROPPABLE, name)}
                  name={name}
                  droppableId={ROLLUP_ROWS_DROPPABLE}
                  onDelete={() => onRollupRowsChange(removeAt(rollupRows, i))}
                />
              )),
              columnInsertionIndex(ROLLUP_ROWS_DROPPABLE, rollupRows)
            )}
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
              itemIds={pivotItemIds}
              isEmpty={pivotColumns.length === 0}
              disabled={pivotColumnsDisabled === true}
            >
              {withDropIndicator(
                pivotColumns.map((name, i) => (
                  <ColumnRow
                    key={columnRowId(PIVOT_COLUMNS_DROPPABLE, name)}
                    name={name}
                    droppableId={PIVOT_COLUMNS_DROPPABLE}
                    onDelete={() =>
                      onPivotColumnsChange(removeAt(pivotColumns, i))
                    }
                  />
                )),
                columnInsertionIndex(PIVOT_COLUMNS_DROPPABLE, pivotColumns)
              )}
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
            {aggregationSettings.aggregations.map((entry, i) => (
              <AggregateSelectRow
                key={aggregationRowId(entry.operation as string)}
                id={aggregationRowId(entry.operation as string)}
                operation={entry.operation}
                columnLabels={entry.selected}
                availableOperations={selectableOperations.filter(
                  op => op === entry.operation || !usedOperations.includes(op)
                )}
                onOperationChange={op => handleChangeAggregateOperation(i, op)}
                onDelete={() => handleDeleteAggregate(i)}
                onDeleteColumn={column =>
                  handleDeleteAggregateColumn(i, column)
                }
              />
            ))}
          </DroppableList>
        </ConfigCard>

        {/* Filterable columns card hidden for now \u2014 props are still threaded
          through so it can be re-enabled without churn. */}
        {/* eslint-enable react/no-unstable-nested-components */}
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
          {dragOverlayPreview}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default PivotConfigSection;
