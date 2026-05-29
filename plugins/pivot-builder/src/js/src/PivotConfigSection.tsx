import { useCallback } from 'react';
import { Button, Checkbox, UISwitch } from '@deephaven/components';
import { vsAdd, vsEdit, vsGripper, vsTrash } from '@deephaven/icons';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-pivot-builder/PivotConfigSection');

/**
 * Mock-data UI section that previews the eventual replacement for the
 * Rollups & Aggregations sidebar. State is fully controlled by the parent;
 * nothing here is wired to the pivot model yet.
 */

export type AggregateEntry = {
  id: string;
  fn: string;
  columns: string[];
};

export type PivotConfigSectionProps = {
  /** Available source columns, used to seed `Add` placeholders. */
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

function newId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

/** Pick the next column not already in `taken`, falling back to a generated name. */
function nextPlaceholderColumn(
  available: readonly string[],
  taken: readonly string[]
): string {
  const used = new Set(taken);
  const free = available.find(c => !used.has(c));
  if (free != null) return free;
  return `Column ${taken.length + 1}`;
}

type ConfigCardProps = {
  title: string;
  on: boolean;
  onToggle: (next: boolean) => void;
  onAdd: () => void;
  children: React.ReactNode;
};

function ConfigCard({
  title,
  on,
  onToggle,
  onAdd,
  children,
}: ConfigCardProps): JSX.Element {
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span style={cardTitleStyle}>{title}</span>
        <UISwitch on={on} onClick={() => onToggle(!on)} />
        <Button kind="secondary" icon={vsAdd} onClick={onAdd}>
          Add
        </Button>
      </div>
      {on && <div>{children}</div>}
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
  const handleAddRollupRow = useCallback(() => {
    onRollupRowsChange([
      ...rollupRows,
      nextPlaceholderColumn(availableColumns, rollupRows),
    ]);
  }, [availableColumns, rollupRows, onRollupRowsChange]);

  const handleAddPivotColumn = useCallback(() => {
    onPivotColumnsChange([
      ...pivotColumns,
      nextPlaceholderColumn(availableColumns, pivotColumns),
    ]);
  }, [availableColumns, pivotColumns, onPivotColumnsChange]);

  const handleAddFilterable = useCallback(() => {
    onFilterableColumnsChange([
      ...filterableColumns,
      nextPlaceholderColumn(availableColumns, filterableColumns),
    ]);
  }, [availableColumns, filterableColumns, onFilterableColumnsChange]);

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
