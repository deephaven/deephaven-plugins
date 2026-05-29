import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, SearchInput, UISwitch } from '@deephaven/components';
import { vsAdd, vsEdit, vsGripper, vsTrash } from '@deephaven/icons';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-pivot-builder/PivotConfigSection');

/**
 * Mock-data UI section that previews the eventual replacement for the
 * Rollups & Aggregations sidebar. State is fully controlled by the parent.
 * Only the Rollup rows card is wired to the model (in CreatePivotPage).
 */

export type AggregateEntry = {
  id: string;
  fn: string;
  columns: string[];
};

export type PivotConfigSectionProps = {
  /** Available source columns. */
  availableColumns: readonly string[];

  rollupRows: string[];
  onRollupRowsChange: (next: string[]) => void;
  rollupRowsOn: boolean;
  onRollupRowsOnChange: (next: boolean) => void;

  pivotColumns: string[];
  onPivotColumnsChange: (next: string[]) => void;
  pivotColumnsOn: boolean;
  onPivotColumnsOnChange: (next: boolean) => void;

  aggregates: AggregateEntry[];
  onAggregatesChange: (next: AggregateEntry[]) => void;
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

function newId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

type ColumnPickerProps = {
  available: readonly string[];
  excluded: readonly string[];
  onPick: (name: string) => void;
  onClose: () => void;
};

function ColumnPicker({
  available,
  excluded,
  onPick,
  onClose,
}: ColumnPickerProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const excludedSet = useMemo(() => new Set(excluded), [excluded]);

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

  return (
    <div ref={containerRef} style={popoverStyle} role="dialog">
      <div style={popoverSearchStyle}>
        <SearchInput
          value={query}
          placeholder="Find column..."
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div style={popoverListStyle} role="listbox">
        {filtered.length === 0 ? (
          <div style={popoverEmptyStyle}>No columns</div>
        ) : (
          filtered.map((name, i) => (
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
                // mousedown so click-outside handler doesn't fire first
                e.preventDefault();
                onPick(name);
              }}
            >
              {name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type ConfigCardProps = {
  title: string;
  on: boolean;
  onToggle: (next: boolean) => void;
  onAdd: () => void;
  picker?: React.ReactNode;
  children: React.ReactNode;
};

function ConfigCard({
  title,
  on,
  onToggle,
  onAdd,
  picker,
  children,
}: ConfigCardProps): JSX.Element {
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span style={cardTitleStyle}>{title}</span>
        <UISwitch on={on} onClick={() => onToggle(!on)} />
        <div style={{ position: 'relative' }}>
          <Button kind="secondary" icon={vsAdd} onClick={onAdd} disabled={!on}>
            Add
          </Button>
          {picker}
        </div>
      </div>
      <div style={on ? undefined : disabledBodyStyle} aria-disabled={!on}>
        {children}
      </div>
    </div>
  );
}

type ColumnRowProps = {
  name: string;
  onDelete: () => void;
};

function ColumnRow({ name, onDelete }: ColumnRowProps): JSX.Element {
  return (
    <div style={rowStyle}>
      <span style={rowLabelStyle}>{name}</span>
      <Button
        kind="ghost"
        icon={vsGripper}
        tooltip="Reorder (not yet wired)"
        onClick={() => undefined}
      />
      <Button kind="ghost" icon={vsTrash} tooltip="Remove" onClick={onDelete} />
    </div>
  );
}

type AggregateRowProps = {
  entry: AggregateEntry;
  onEdit: () => void;
  onDelete: () => void;
};

function AggregateRow({
  entry,
  onEdit,
  onDelete,
}: AggregateRowProps): JSX.Element {
  const label = `${entry.fn} (${entry.columns.join(', ')})`;
  return (
    <div style={rowStyle}>
      <span style={rowLabelStyle}>{label}</span>
      <Button kind="ghost" icon={vsEdit} tooltip="Edit" onClick={onEdit} />
      <Button
        kind="ghost"
        icon={vsGripper}
        tooltip="Reorder (not yet wired)"
        onClick={() => undefined}
      />
      <Button kind="ghost" icon={vsTrash} tooltip="Remove" onClick={onDelete} />
    </div>
  );
}

export function PivotConfigSection({
  availableColumns,
  rollupRows,
  onRollupRowsChange,
  rollupRowsOn,
  onRollupRowsOnChange,
  pivotColumns,
  onPivotColumnsChange,
  pivotColumnsOn,
  onPivotColumnsOnChange,
  aggregates,
  onAggregatesChange,
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
    log.info('Pivot column picker not yet wired');
  }, []);

  const handleAddFilterable = useCallback(() => {
    log.info('Filterable column picker not yet wired');
  }, []);

  const handleAddAggregate = useCallback(() => {
    const first = availableColumns[0] ?? 'Value';
    onAggregatesChange([
      ...aggregates,
      { id: newId(), fn: 'Sum', columns: [first] },
    ]);
  }, [availableColumns, aggregates, onAggregatesChange]);

  const handleEditAggregate = useCallback((entry: AggregateEntry) => {
    log.info('Edit aggregate (not yet wired)', entry);
  }, []);

  const removeAt = <T,>(arr: T[], index: number): T[] => {
    const next = arr.slice();
    next.splice(index, 1);
    return next;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ConfigCard
        title="Rollup rows"
        on={rollupRowsOn}
        onToggle={onRollupRowsOnChange}
        onAdd={handleAddRollupRow}
        picker={
          rollupPickerOpen ? (
            <ColumnPicker
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
              key={`${name}-${i}`}
              name={name}
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
      >
        {pivotColumns.length === 0 ? (
          <div style={emptyStyle}>No columns</div>
        ) : (
          pivotColumns.map((name, i) => (
            <ColumnRow
              key={`${name}-${i}`}
              name={name}
              onDelete={() => onPivotColumnsChange(removeAt(pivotColumns, i))}
            />
          ))
        )}
      </ConfigCard>

      <ConfigCard
        title="Aggregate values"
        on={aggregatesOn}
        onToggle={onAggregatesOnChange}
        onAdd={handleAddAggregate}
      >
        {aggregates.length === 0 ? (
          <div style={emptyStyle}>No aggregates</div>
        ) : (
          aggregates.map((entry, i) => (
            <AggregateRow
              key={entry.id}
              entry={entry}
              onEdit={() => handleEditAggregate(entry)}
              onDelete={() => onAggregatesChange(removeAt(aggregates, i))}
            />
          ))
        )}
      </ConfigCard>

      <ConfigCard
        title="Add filterable columns"
        on={filterableColumnsOn}
        onToggle={onFilterableColumnsOnChange}
        onAdd={handleAddFilterable}
      >
        {filterableColumns.length === 0 ? (
          <div style={emptyStyle}>No columns</div>
        ) : (
          filterableColumns.map((name, i) => (
            <ColumnRow
              key={`${name}-${i}`}
              name={name}
              onDelete={() =>
                onFilterableColumnsChange(removeAt(filterableColumns, i))
              }
            />
          ))
        )}
      </ConfigCard>

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
