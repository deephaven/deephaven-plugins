import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, SearchInput, Select } from '@deephaven/components';
import {
  AggregationUtils,
  type Aggregation,
  type AggregationOperation,
} from '@deephaven/iris-grid';
import PivotPopover from './PivotPopover';

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

export default function AggregatePicker({
  anchorRef,
  availableColumns,
  columnTypes,
  availableOperations,
  initial,
  existingSelections,
  onCommit,
  onClose,
}: AggregatePickerProps): JSX.Element {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [operation, setOperation] = useState<string>(initial.operation);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(existingSelections[initial.operation] ?? initial.selected)
  );
  const [query, setQuery] = useState('');

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

  return (
    <PivotPopover
      anchorRef={anchorRef}
      onClose={onClose}
      onOpen={() => selectRef.current?.focus()}
      className="pivot-agg-popover"
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
    </PivotPopover>
  );
}
