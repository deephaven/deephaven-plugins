import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PivotConfig, ColumnInfo } from './usePivotToggle';

const AGGREGATION_TYPES = [
  'Sum',
  'Count',
  'Avg',
  'Min',
  'Max',
  'First',
  'Last',
] as const;

// Inline styles so the dialog works in dynamically-loaded plugin bundles
// where a separate CSS file would not be injected automatically.
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } satisfies CSSProperties,
  dialog: {
    background: 'var(--dh-color-bg, #1a1a2e)',
    color: 'var(--dh-color-text, #c8c8c8)',
    border: '1px solid var(--dh-color-border, #444)',
    borderRadius: 6,
    padding: 16,
    minWidth: 500,
    maxWidth: 700,
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  } satisfies CSSProperties,
  title: { margin: '0 0 12px', fontSize: 16 } satisfies CSSProperties,
  layout: { display: 'flex', gap: 12 } satisfies CSSProperties,
  section: { flex: 1 } satisfies CSSProperties,
  sectionHeader: {
    margin: '0 0 6px',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--dh-color-text-muted, #999)',
  } satisfies CSSProperties,
  list: {
    border: '1px solid var(--dh-color-border, #444)',
    borderRadius: 4,
    minHeight: 80,
    maxHeight: 200,
    overflowY: 'auto',
    padding: 4,
  } satisfies CSSProperties,
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '3px 6px',
    borderRadius: 3,
    fontSize: 12,
  } satisfies CSSProperties,
  colName: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,
  colType: {
    fontSize: 10,
    color: 'var(--dh-color-text-muted, #888)',
  } satisfies CSSProperties,
  itemActions: {
    display: 'flex',
    gap: 2,
    flexShrink: 0,
  } satisfies CSSProperties,
  smallBtn: {
    background: 'transparent',
    border: '1px solid var(--dh-color-border, #555)',
    color: 'var(--dh-color-text, #c8c8c8)',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 10,
    padding: '1px 4px',
    lineHeight: 1.3,
  } satisfies CSSProperties,
  removeBtn: {
    background: 'transparent',
    border: '1px solid var(--dh-color-border, #555)',
    color: 'var(--dh-color-text, #c8c8c8)',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 14,
    padding: '0 4px',
    lineHeight: 1,
  } satisfies CSSProperties,
  empty: {
    fontSize: 11,
    color: 'var(--dh-color-text-muted, #777)',
    padding: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  } satisfies CSSProperties,
  targets: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } satisfies CSSProperties,
  agg: { marginTop: 6, fontSize: 12 } satisfies CSSProperties,
  aggSelect: {
    background: 'var(--dh-color-bg, #1a1a2e)',
    color: 'var(--dh-color-text, #c8c8c8)',
    border: '1px solid var(--dh-color-border, #555)',
    borderRadius: 3,
    padding: '2px 4px',
    fontSize: 12,
  } satisfies CSSProperties,
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid var(--dh-color-border, #444)',
  } satisfies CSSProperties,
  btn: {
    background: 'transparent',
    color: 'var(--dh-color-text, #c8c8c8)',
    border: '1px solid var(--dh-color-border, #555)',
    borderRadius: 4,
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: 13,
  } satisfies CSSProperties,
  btnPrimary: {
    background: 'var(--dh-color-accent, #4c6ef5)',
    color: '#fff',
    border: '1px solid var(--dh-color-accent, #4c6ef5)',
    borderRadius: 4,
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: 13,
  } satisfies CSSProperties,
};

interface PivotBuilderDialogProps {
  columns: ColumnInfo[];
  initialConfig: PivotConfig | null;
  onApply: (config: PivotConfig) => void;
  onCancel: () => void;
}

export function PivotBuilderDialog({
  columns,
  initialConfig,
  onApply,
  onCancel,
}: PivotBuilderDialogProps): JSX.Element {
  const [rowKeys, setRowKeys] = useState<string[]>([]);
  const [columnKeys, setColumnKeys] = useState<string[]>([]);
  const [valueColumns, setValueColumns] = useState<string[]>([]);
  const [aggregationType, setAggregationType] =
    useState<(typeof AGGREGATION_TYPES)[number]>('Sum');

  // Restore previous config if available, otherwise auto-populate from column types
  useEffect(() => {
    if (initialConfig != null) {
      const columnNames = new Set(columns.map(c => c.name));
      // Filter to only columns that still exist in the table
      setRowKeys(initialConfig.rowKeys.filter(n => columnNames.has(n)));
      setColumnKeys(initialConfig.columnKeys.filter(n => columnNames.has(n)));
      const aggType = Object.keys(initialConfig.aggregations)[0] as
        | (typeof AGGREGATION_TYPES)[number]
        | undefined;
      const vals = aggType != null ? initialConfig.aggregations[aggType] : [];
      setValueColumns((vals ?? []).filter(n => columnNames.has(n)));
      if (aggType != null) {
        setAggregationType(aggType);
      }
      return;
    }
    const numeric = columns.filter(c => c.isNumeric).map(c => c.name);
    const nonNumeric = columns
      .filter(c => c.isNumeric === false)
      .map(c => c.name);
    setRowKeys(nonNumeric.slice(0, 1));
    setColumnKeys(nonNumeric.length > 1 ? nonNumeric.slice(1, 2) : []);
    setValueColumns(numeric);
    if (numeric.length === 0) {
      setAggregationType('Count');
    }
  }, [columns, initialConfig]);

  const availableColumns = useMemo(
    () =>
      columns.filter(
        c =>
          !rowKeys.includes(c.name) &&
          !columnKeys.includes(c.name) &&
          !valueColumns.includes(c.name)
      ),
    [columns, rowKeys, columnKeys, valueColumns]
  );

  const addTo = useCallback((target: 'row' | 'col' | 'value', name: string) => {
    if (target === 'row') setRowKeys(prev => [...prev, name]);
    else if (target === 'col') setColumnKeys(prev => [...prev, name]);
    else setValueColumns(prev => [...prev, name]);
  }, []);

  const removeFrom = useCallback(
    (target: 'row' | 'col' | 'value', name: string) => {
      if (target === 'row') setRowKeys(prev => prev.filter(n => n !== name));
      else if (target === 'col') {
        setColumnKeys(prev => prev.filter(n => n !== name));
      } else setValueColumns(prev => prev.filter(n => n !== name));
    },
    []
  );

  const canApply = rowKeys.length > 0 && valueColumns.length > 0;

  const handleApply = useCallback(() => {
    onApply({
      rowKeys,
      columnKeys,
      aggregations: { [aggregationType]: valueColumns },
    });
  }, [onApply, rowKeys, columnKeys, valueColumns, aggregationType]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div style={styles.overlay} onClick={onCancel}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        <h3 style={styles.title}>Build Pivot Table</h3>

        <div style={styles.layout}>
          {/* Available columns */}
          <div style={styles.section}>
            <h4 style={styles.sectionHeader}>Available Columns</h4>
            <div style={styles.list}>
              {availableColumns.length === 0 && (
                <div style={styles.empty}>All columns assigned</div>
              )}
              {availableColumns.map(col => (
                <div key={col.name} style={styles.item}>
                  <span style={styles.colName}>
                    {col.name}
                    <span style={styles.colType}>{col.type}</span>
                  </span>
                  <span style={styles.itemActions}>
                    <button
                      type="button"
                      style={styles.smallBtn}
                      onClick={() => addTo('row', col.name)}
                      title="Add to Row Keys"
                    >
                      +Row
                    </button>
                    <button
                      type="button"
                      style={styles.smallBtn}
                      onClick={() => addTo('col', col.name)}
                      title="Add to Column Keys"
                    >
                      +Col
                    </button>
                    <button
                      type="button"
                      style={styles.smallBtn}
                      onClick={() => addTo('value', col.name)}
                      title="Add to Values"
                    >
                      +Val
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target buckets */}
          <div style={styles.targets}>
            <div style={styles.section}>
              <h4 style={styles.sectionHeader}>Row Keys</h4>
              <div style={styles.list}>
                {rowKeys.length === 0 && (
                  <div style={styles.empty}>At least one required</div>
                )}
                {rowKeys.map(name => (
                  <div key={name} style={styles.item}>
                    <span>{name}</span>
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => removeFrom('row', name)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionHeader}>Column Keys</h4>
              <div style={styles.list}>
                {columnKeys.length === 0 && (
                  <div style={styles.empty}>None</div>
                )}
                {columnKeys.map(name => (
                  <div key={name} style={styles.item}>
                    <span>{name}</span>
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => removeFrom('col', name)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionHeader}>Values</h4>
              <div style={styles.list}>
                {valueColumns.length === 0 && (
                  <div style={styles.empty}>At least one required</div>
                )}
                {valueColumns.map(name => (
                  <div key={name} style={styles.item}>
                    <span>{name}</span>
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => removeFrom('value', name)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div style={styles.agg}>
                <label htmlFor="pivot-agg-select">
                  Aggregation:{' '}
                  <select
                    id="pivot-agg-select"
                    style={styles.aggSelect}
                    value={aggregationType}
                    onChange={e =>
                      setAggregationType(
                        e.target.value as (typeof AGGREGATION_TYPES)[number]
                      )
                    }
                  >
                    {AGGREGATION_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.btn} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            style={{
              ...styles.btnPrimary,
              ...(canApply ? {} : { opacity: 0.4, cursor: 'not-allowed' }),
            }}
            disabled={!canApply}
            onClick={handleApply}
            title={
              canApply
                ? undefined
                : 'Select at least one Row Key and one Value column'
            }
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default PivotBuilderDialog;
