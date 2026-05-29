import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Select } from '@deephaven/components';
import { type IrisGridTableOptionsPageProps } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import {
  isNumericColumn,
  isPivotBuilderIrisGridModel,
  makeDefaultPivotConfig,
  type PivotConfig,
} from './pivotBuilderModel';
import { PivotConfigSection, type AggregateEntry } from './PivotConfigSection';

const log = Log.module('@deephaven/js-plugin-pivot-builder/CreatePivotPage');

/**
 * Aggregation functions supported by the pivot service. `numericOnly` filters
 * the column pool; functions like `Count` can be applied to any column (or to
 * no columns at all, meaning a row count).
 */
const PIVOT_FUNCTIONS: readonly {
  value: string;
  label: string;
  numericOnly: boolean;
}[] = [
  { value: 'Sum', label: 'Sum', numericOnly: true },
  { value: 'AbsSum', label: 'Abs Sum', numericOnly: true },
  { value: 'Avg', label: 'Average', numericOnly: true },
  { value: 'Min', label: 'Min', numericOnly: false },
  { value: 'Max', label: 'Max', numericOnly: false },
  { value: 'Std', label: 'Standard deviation', numericOnly: true },
  { value: 'Var', label: 'Variance', numericOnly: true },
  { value: 'Median', label: 'Median', numericOnly: true },
  { value: 'First', label: 'First', numericOnly: false },
  { value: 'Last', label: 'Last', numericOnly: false },
  { value: 'Count', label: 'Count', numericOnly: false },
];

const DEFAULT_FUNCTION = 'Sum';

function isNumericOnly(fn: string): boolean {
  return PIVOT_FUNCTIONS.find(f => f.value === fn)?.numericOnly ?? false;
}

/**
 * Sidebar `configPage` for the Create Pivot menu item.
 *
 * Selecting columns and clicking Apply sets `model.pivotConfig`; the
 * pivot-builder proxy then swaps its inner model and fires the standard
 * `COLUMNS_CHANGED`/`UPDATED` events, causing IrisGrid to re-render in
 * place.
 */
export function CreatePivotPage({
  model,
}: IrisGridTableOptionsPageProps): JSX.Element {
  const [error, setError] = useState<string | null>(null);

  const isProxy = isPivotBuilderIrisGridModel(model);
  const hasPivot = isProxy && model.pivotConfig != null;

  // Always source columns from the original (pre-pivot) table so the
  // selectors don't shift to pivot output columns after Apply.
  const columns = isProxy ? model.sourceTable.columns : model.columns;
  const numericColumnNames = useMemo(
    () => columns.filter(isNumericColumn).map(c => c.name),
    [columns]
  );
  const allColumnNames = useMemo(() => columns.map(c => c.name), [columns]);

  // Seed state from current pivotConfig (if any) or sensible defaults.
  const seed = useMemo<PivotConfig>(
    () => (isProxy && model.pivotConfig) || makeDefaultPivotConfig(columns),
    [isProxy, model, columns]
  );

  // Pick the first function in `seed.aggregations` (the config supports a
  // map of `function -> columns`, but the UI currently exposes a single
  // function at a time).
  const seededFunction = Object.keys(seed.aggregations)[0] ?? DEFAULT_FUNCTION;

  const [rowKeys, setRowKeys] = useState<string[]>(seed.rowKeys);
  const [columnKeys, setColumnKeys] = useState<string[]>(seed.columnKeys);
  const [aggFunction, setAggFunction] = useState<string>(seededFunction);
  const [aggColumns, setAggColumns] = useState<string[]>(
    seed.aggregations[seededFunction] ?? []
  );

  // Mock-data state for the new card-based config section. Not yet wired to
  // any model setter — see plans/DH-21476-pivot-builder-config-ui.md.
  const [mockRollupRows, setMockRollupRows] = useState<string[]>([
    'Sym',
    'Exchange',
  ]);
  const [mockRollupRowsOn, setMockRollupRowsOn] = useState(true);
  const [mockPivotColumns, setMockPivotColumns] = useState<string[]>([]);
  const [mockPivotColumnsOn, setMockPivotColumnsOn] = useState(false);
  const [mockAggregates, setMockAggregates] = useState<AggregateEntry[]>([
    { id: 'seed-sum', fn: 'Sum', columns: ['Price', 'Size'] },
  ]);
  const [mockAggregatesOn, setMockAggregatesOn] = useState(true);
  const [mockFilterable, setMockFilterable] = useState<string[]>([]);
  const [mockFilterableOn, setMockFilterableOn] = useState(false);
  const [mockIncludeConstituents, setMockIncludeConstituents] = useState(true);
  const [mockNonAggregatedInRollup, setMockNonAggregatedInRollup] =
    useState(true);

  useEffect(() => {
    const fn = Object.keys(seed.aggregations)[0] ?? DEFAULT_FUNCTION;
    setRowKeys(seed.rowKeys);
    setColumnKeys(seed.columnKeys);
    setAggFunction(fn);
    setAggColumns(seed.aggregations[fn] ?? []);
  }, [seed]);

  const aggPool = useMemo(
    () => (isNumericOnly(aggFunction) ? numericColumnNames : allColumnNames),
    [aggFunction, numericColumnNames, allColumnNames]
  );

  const handleFunctionChange = useCallback(
    (value: string): void => {
      setAggFunction(value);
      // Drop columns that aren't eligible for the new function.
      const nextPool = isNumericOnly(value)
        ? new Set(numericColumnNames)
        : new Set(allColumnNames);
      setAggColumns(prev => prev.filter(n => nextPool.has(n)));
    },
    [numericColumnNames, allColumnNames]
  );

  // Selecting a column in one role removes it from the other two (a column
  // can only play one role at a time). All checkboxes stay active so the
  // user can move a column between roles in a single click. Future work:
  // surface a visual cue when a column is already claimed by another role.
  const handleToggle = useCallback(
    (role: 'row' | 'col' | 'agg', name: string, checked: boolean): void => {
      const withRemoved = (prev: string[]): string[] =>
        prev.filter(n => n !== name);
      const withAdded = (prev: string[]): string[] =>
        prev.includes(name) ? prev : [...prev, name];

      setRowKeys(prev => {
        if (role === 'row') {
          return checked ? withAdded(prev) : withRemoved(prev);
        }
        return checked ? withRemoved(prev) : prev;
      });
      setColumnKeys(prev => {
        if (role === 'col') {
          return checked ? withAdded(prev) : withRemoved(prev);
        }
        return checked ? withRemoved(prev) : prev;
      });
      setAggColumns(prev => {
        if (role === 'agg') {
          return checked ? withAdded(prev) : withRemoved(prev);
        }
        return checked ? withRemoved(prev) : prev;
      });
    },
    []
  );

  const handleApply = useCallback(() => {
    setError(null);
    if (!isPivotBuilderIrisGridModel(model)) {
      setError(
        'Create Pivot requires the pivot-builder proxy model (CorePlus PivotService).'
      );
      return;
    }
    if (rowKeys.length === 0) {
      setError('Select at least one row key.');
      return;
    }
    // For `Count` an empty column list is meaningful (count rows). For other
    // functions, require at least one column.
    if (aggFunction !== 'Count' && aggColumns.length === 0) {
      setError(`Select at least one column for ${aggFunction}.`);
      return;
    }
    try {
      const config: PivotConfig = {
        rowKeys,
        columnKeys,
        aggregations: { [aggFunction]: aggColumns },
      };
      log.info('Applying pivot config', config);
      model.pivotConfig = config;
    } catch (e) {
      log.error('Failed to apply pivot config', e);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [model, rowKeys, columnKeys, aggFunction, aggColumns]);

  const handleReset = useCallback(() => {
    if (!isPivotBuilderIrisGridModel(model)) return;
    log.info('Reverting to flat table model');
    model.pivotConfig = null;
    setError(null);
  }, [model]);

  // Prevent the same column from being selected in multiple roles.
  const renderColumnList = (
    role: 'row' | 'col' | 'agg',
    selected: string[],
    pool: readonly string[]
  ): JSX.Element => (
    <div
      style={{
        maxHeight: 160,
        overflowY: 'auto',
        border: '1px solid var(--dh-color-border-base, #444)',
        borderRadius: 3,
        padding: '4px 8px',
      }}
    >
      {pool.length === 0 && (
        <div style={{ opacity: 0.6, fontStyle: 'italic' }}>No columns</div>
      )}
      {pool.map(name => (
        <Checkbox
          key={name}
          checked={selected.includes(name)}
          onChange={e => handleToggle(role, name, e.target.checked)}
        >
          {name}
        </Checkbox>
      ))}
    </div>
  );

  return (
    <div className="iris-grid-plugin-sidebar-page" style={{ padding: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PivotConfigSection
          availableColumns={allColumnNames}
          rollupRows={mockRollupRows}
          onRollupRowsChange={setMockRollupRows}
          rollupRowsOn={mockRollupRowsOn}
          onRollupRowsOnChange={setMockRollupRowsOn}
          pivotColumns={mockPivotColumns}
          onPivotColumnsChange={setMockPivotColumns}
          pivotColumnsOn={mockPivotColumnsOn}
          onPivotColumnsOnChange={setMockPivotColumnsOn}
          aggregates={mockAggregates}
          onAggregatesChange={setMockAggregates}
          aggregatesOn={mockAggregatesOn}
          onAggregatesOnChange={setMockAggregatesOn}
          filterableColumns={mockFilterable}
          onFilterableColumnsChange={setMockFilterable}
          filterableColumnsOn={mockFilterableOn}
          onFilterableColumnsOnChange={setMockFilterableOn}
          includeConstituents={mockIncludeConstituents}
          onIncludeConstituentsChange={setMockIncludeConstituents}
          nonAggregatedInRollup={mockNonAggregatedInRollup}
          onNonAggregatedInRollupChange={setMockNonAggregatedInRollup}
        />
        <div>
          <label style={{ fontWeight: 600 }}>Row keys</label>
          {renderColumnList('row', rowKeys, allColumnNames)}
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>Column keys</label>
          {renderColumnList('col', columnKeys, allColumnNames)}
        </div>
        <div>
          <label
            htmlFor="pivot-builder-aggregation-function"
            style={{ fontWeight: 600 }}
          >
            Aggregation function
          </label>
          <Select
            id="pivot-builder-aggregation-function"
            value={aggFunction}
            onChange={handleFunctionChange}
          >
            {PIVOT_FUNCTIONS.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>
            Columns ({aggFunction})
            {aggFunction === 'Count' && (
              <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: 6 }}>
                — leave empty to count rows
              </span>
            )}
          </label>
          {renderColumnList('agg', aggColumns, aggPool)}
        </div>
      </div>
      {error != null && (
        <p
          role="alert"
          style={{ color: 'var(--dh-color-red, #c43d3d)', marginTop: 8 }}
        >
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button kind="primary" onClick={handleApply} disabled={!isProxy}>
          {hasPivot ? 'Update Pivot' : 'Create Pivot'}
        </Button>
        {hasPivot && (
          <Button kind="danger" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

export default CreatePivotPage;
